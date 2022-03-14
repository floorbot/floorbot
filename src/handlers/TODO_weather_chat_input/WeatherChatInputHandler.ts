import { GuildMember, Message, MessageComponentInteraction, Guild, GuildChannel, ChatInputApplicationCommandData, ChatInputCommandInteraction } from 'discord.js';
import { AirPollutionData, GeocodeData, LocationQuery, OneCallData, OpenWeatherAPI, WeatherAPIError } from '../../lib/apis/open-weather/OpenWeatherAPI.js';
import { WeatherComponentID, WeatherReplyBuilder, WeatherSelectMenuID, WeatherTempsOrder } from './WeatherMixins.js';
import { WeatherCommandData, WeatherSubCommand } from './WeatherChatInputCommandData.js';
import { ButtonComponentID } from '../../lib/discord/builders/ButtonActionRowBuilder.js';
import { ApplicationCommandHandler, HandlerClient } from 'discord.js-handlers';
import WeatherLinkRow, { WeatherLinkTable } from './WeatherLinkTable.js';
import { HandlerUtil } from '../../lib/discord/HandlerUtil.js';
import { Pool } from 'mariadb';

export type OpenWeatherData = OneCallData & GeocodeData & AirPollutionData;

export class WeatherChatInputHandler extends ApplicationCommandHandler<ChatInputApplicationCommandData> {

    private readonly database: WeatherLinkTable;
    private readonly openweather: OpenWeatherAPI;

    constructor(pool: Pool, apiKey: string) {
        super(WeatherCommandData);
        this.database = new WeatherLinkTable(pool);
        this.openweather = new OpenWeatherAPI({ apiKey: apiKey });
    }

    public async run(command: ChatInputCommandInteraction<'cached'>): Promise<any> {
        const subCommand = command.options.getSubcommand();
        switch (subCommand) {
            case WeatherSubCommand.LOCATION: {
                await command.deferReply();
                const city_name = command.options.getString('city_name', true);
                const state_code = command.options.getString('state_code');
                const country_code = command.options.getString('country_code');
                const location: LocationQuery = {
                    city_name: city_name.trim(),
                    ...(state_code && { state_code: state_code.trim() }),
                    ...(country_code && { country_code: country_code.trim() })
                };
                const weather = await this.fetchWeather(location);
                if (!weather) return command.followUp(new WeatherReplyBuilder(command).addWeatherUnknownLocationEmbed(location));
                if (this.openweather.isError(weather)) return command.followUp(new WeatherReplyBuilder(command).addWeatherAPIErrorEmbed(weather));
                const embed = new WeatherReplyBuilder(command)
                    .addWeatherCurrentEmbed(weather)
                    .addWeatherActionRow(this.chooseButtons(weather, WeatherComponentID.CURRENT), weather);
                const message = await command.followUp(embed) as Message;
                const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 10 });
                collector.on('collect', this.createCollectorFunction(weather));
                collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
                break;
            }
            case WeatherSubCommand.USER: {
                await command.deferReply();
                const member = (command.options.getMember('user') || command.member);
                const link = await this.database.selectLink(member);
                if (!link) return command.followUp(new WeatherReplyBuilder(command).addWeatherMissingParamsEmbed(member));
                const location: LocationQuery = {
                    city_name: link.name,
                    ...(link.state && { state_code: link.state }),
                    ...(link.country && { country_code: link.country })
                };
                const weather = await this.fetchWeather(location);
                if (!weather) return command.followUp(new WeatherReplyBuilder(command).addWeatherUnknownLocationEmbed(location));
                if (this.openweather.isError(weather)) return command.followUp(new WeatherReplyBuilder(command).addWeatherAPIErrorEmbed(weather));
                const embed = new WeatherReplyBuilder(command)
                    .addWeatherCurrentEmbed(weather)
                    .addWeatherActionRow(this.chooseButtons(weather, WeatherComponentID.CURRENT), weather);
                const message = await command.followUp(embed) as Message;
                const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 10 });
                collector.on('collect', this.createCollectorFunction(weather));
                collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
                break;
            }
            case WeatherSubCommand.SERVER_TEMPS: {
                await command.deferReply();
                const { channel, guild } = <{ channel: GuildChannel, guild: Guild; }>command;
                const links: [OneCallData, GuildMember, WeatherLinkRow][] = new Array();
                const allLinks = await this.database.selectLinks(guild);
                const loadingEmbed = new WeatherReplyBuilder(command).addWeatherLoadingEmbed(allLinks.length, 0);
                let lastUpdate = (await command.followUp(loadingEmbed) as Message).createdTimestamp;
                for (const [i, link] of allLinks.entries()) {
                    const member = channel.members.get(link.user_id.toString());
                    if (member) {
                        const onecall = await this.openweather.oneCall(link);
                        if (this.openweather.isError(onecall)) continue;
                        links.push([onecall, member, link]);
                    }
                    if (Date.now() - lastUpdate >= 1000) {
                        const loadingEmbed = new WeatherReplyBuilder(command).addWeatherLoadingEmbed(allLinks.length, i + 1);
                        lastUpdate = (await command.editReply(loadingEmbed) as Message).createdTimestamp;
                    }
                }
                if (!links.length) return command.followUp(new WeatherReplyBuilder(command).addWeatherNoLinkedMembersEmbed(channel));
                const viewData = { page: 0, perPage: 40, totalPages: Math.floor(links.length / 40) + 1, order: WeatherTempsOrder.HOTTEST };
                const embed = new WeatherReplyBuilder(command).addWeatherServerTempsEmbed(links, viewData)
                    .addWeatherOrderSelectMenu(viewData.order)
                    .addWeatherPageActionRow(viewData);
                const message = await command.editReply(embed) as Message;
                const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 10 });
                collector.on('collect', async component => {
                    await component.deferUpdate();
                    if (component.isButton() && component.customId === ButtonComponentID.NEXT_PAGE) { viewData.page++; }
                    if (component.isButton() && component.customId === ButtonComponentID.PREVIOUS_PAGE) { viewData.page--; }
                    if (component.isSelectMenu() && component.customId === WeatherSelectMenuID.ORDER) { viewData.order = component.values[0] as WeatherTempsOrder; }
                    viewData.page = viewData.page % (Math.floor(links.length / viewData.perPage) + 1);
                    viewData.page = viewData.page >= 0 ? viewData.page : (Math.floor(links.length / viewData.perPage) + 1) + viewData.page;
                    const embed = new WeatherReplyBuilder(command).addWeatherServerTempsEmbed(links, viewData)
                        .addWeatherOrderSelectMenu(viewData.order)
                        .addWeatherPageActionRow(viewData);
                    await component.editReply(embed);
                });
                collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
                break;
            }
            case WeatherSubCommand.LINK: {
                const member = (command.options.getMember('user') || command.member);
                if (command.member !== member && !HandlerUtil.isAdminOrOwner(command.member)) return command.reply(new WeatherReplyBuilder(command).addWeatherMissingAdminEmbed());
                await command.deferReply();
                const city_name = command.options.getString('city_name', true);
                const state_code = command.options.getString('state_code');
                const country_code = command.options.getString('country_code');
                const location: LocationQuery = {
                    city_name: city_name.trim(),
                    ...(state_code && { state_code: state_code.trim() }),
                    ...(country_code && { country_code: country_code.trim() })
                };
                const weather = await this.fetchWeather(location);
                if (!weather) return command.followUp(new WeatherReplyBuilder(command).addWeatherUnknownLocationEmbed(location));
                if (this.openweather.isError(weather)) return command.followUp(new WeatherReplyBuilder(command).addWeatherAPIErrorEmbed(weather));
                await this.database.insertLink(member, weather);
                const embed = new WeatherReplyBuilder(command).addWeatherLinkedEmbed(weather, member)
                    .addWeatherActionRow(this.chooseButtons(weather), weather);
                const message = await command.followUp(embed) as Message;
                const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 10 });
                collector.on('collect', this.createCollectorFunction(weather));
                collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
                break;
            }
            case WeatherSubCommand.UNLINK: {
                const member = (command.options.getMember('user') || command.member);
                if (command.member !== member && !HandlerUtil.isAdminOrOwner(command.member)) {
                    const replyOptions = new WeatherReplyBuilder(command).addAdminOrOwnerEmbed();
                    return command.reply(replyOptions);
                }
                await command.deferReply();
                await this.database.deleteLink(member);
                const embed = new WeatherReplyBuilder(command).addWeatherUnlinkedEmbed(member)
                    .clearComponents();
                return command.followUp(embed);
            }
        }
    }

    private async fetchWeather(location: LocationQuery): Promise<OpenWeatherData | WeatherAPIError | null> {
        const geocoding = await this.openweather.geocoding(location);
        if (this.openweather.isError(geocoding)) return geocoding;
        if (!geocoding.length) return null;
        const onecall = await this.openweather.oneCall(geocoding[0]!);
        if (this.openweather.isError(onecall)) return onecall;
        const air = await this.openweather.airPollution(geocoding[0]!);
        if (this.openweather.isError(air)) return air;
        return { ...geocoding[0]!, ...onecall, ...air };
    }

    private createCollectorFunction(weather: OpenWeatherData): (component: MessageComponentInteraction) => void {
        return async (component: MessageComponentInteraction) => {
            try {
                if (component.isButton()) {
                    switch (component.customId) {
                        case WeatherComponentID.CURRENT: {
                            await component.deferUpdate();
                            const embed = new WeatherReplyBuilder(component).addWeatherCurrentEmbed(weather)
                                .addWeatherActionRow(this.chooseButtons(weather, WeatherComponentID.CURRENT), weather);
                            await component.editReply(embed);
                            break;
                        }
                        case WeatherComponentID.FORECAST: {
                            await component.deferUpdate();
                            const embed = new WeatherReplyBuilder(component).addWeatherForecastEmbed(weather)
                                .addWeatherActionRow(this.chooseButtons(weather, WeatherComponentID.FORECAST), weather);
                            await component.editReply(embed);
                            break;
                        }
                        case WeatherComponentID.AIR_QUALITY: {
                            await component.deferUpdate();
                            const embed = new WeatherReplyBuilder(component).addWeatherAirPollutionEmbed(weather)
                                .addWeatherActionRow(this.chooseButtons(weather, WeatherComponentID.AIR_QUALITY), weather);
                            await component.editReply(embed);
                            break;
                        }
                        case WeatherComponentID.WARNING: {
                            await component.deferUpdate();
                            const embed = new WeatherReplyBuilder(component).addWeatherAlertEmbed(weather)
                                .addWeatherActionRow(this.chooseButtons(weather, WeatherComponentID.WARNING), weather);
                            await component.editReply(embed);
                            break;
                        }
                    }
                }
            } catch { }
        };
    }

    private chooseButtons(weather: OpenWeatherData, currentPage?: WeatherComponentID): WeatherComponentID[] {
        const weatherButtons: WeatherComponentID[] = [
            WeatherComponentID.CURRENT,
            WeatherComponentID.FORECAST,
            WeatherComponentID.AIR_QUALITY,
            ...(weather.alerts && weather.alerts.length ? [WeatherComponentID.WARNING] : ([] as WeatherComponentID[]))
        ];
        currentPage && weatherButtons.splice(weatherButtons.indexOf(currentPage), 1);
        return weatherButtons;
    }

    public override async setup(client: HandlerClient): Promise<any> {
        return super.setup(client).then(() => this.database.createTable()).then(() => true);
    }
}
