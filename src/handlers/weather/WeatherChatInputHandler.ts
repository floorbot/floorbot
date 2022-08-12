import { ChatInputCommandInteraction, Guild, GuildChannel, GuildMember, MessageComponentInteraction } from 'discord.js';
import { LocationQuery, OpenWeatherAPI, OpenWeatherData } from './open_weather/OpenWeatherAPI.js';
import { PageableComponentID } from '../../helpers/pageable/PageableActionRow.js';
import { WeatherSlashCommand } from './builders/commands/WeatherSlashCommand.js';
import WeatherLinkRow, { WeatherLinkTable } from './tables/WeatherLinkTable.js';
import { OpenWeatherAPILimiter } from './open_weather/OpenWeatherAPILimiter.js';
import { WeatherAPIError } from './open_weather/interfaces/WeatherAPIError.js';
import { OneCallData } from './open_weather/interfaces/OneCallData.js';
import { ChatInputCommandHandler } from 'discord.js-handlers';
import { WeatherReply } from './builders/WeatherReply.js';
import { WeatherEmbed } from './builders/WeatherEmbed.js';
import { Util } from '../../helpers/Util.js';
import { Redis } from 'ioredis';
import { Pool } from 'mariadb';

export class WeatherChatInputHandler extends ChatInputCommandHandler {

    private readonly database: WeatherLinkTable;
    private readonly openweather: OpenWeatherAPI;

    constructor({ pool, apiKey, redis }: { pool: Pool, apiKey: string, redis: Redis; }) {
        super(WeatherSlashCommand.global());
        const limiter = new OpenWeatherAPILimiter(apiKey, {}, redis);
        this.openweather = new OpenWeatherAPI({ apiKey: apiKey, limiter: limiter });
        this.database = new WeatherLinkTable(pool);
    }

    public async run(command: ChatInputCommandInteraction): Promise<any> {
        const subCommand = command.options.getSubcommand();
        switch (subCommand) {
            case WeatherSubCommandName.All: {
                await command.deferReply();
                const { channel, guild } = <{ channel: GuildChannel, guild: Guild; }>command;
                const links: [OneCallData, GuildMember, WeatherLinkRow][] = new Array();
                const allLinks = await this.database.selectLinks(guild);
                const loadingEmbed = new WeatherReply(command).addEmbeds(WeatherEmbed.loadingEmbed(allLinks.length, 0));
                let lastUpdate = (await command.followUp(loadingEmbed)).createdTimestamp;
                for (const [i, link] of allLinks.entries()) {
                    const member = channel.members.get(link.user_id.toString());
                    if (member) {
                        const onecall = await this.openweather.oneCall(link);
                        if (this.openweather.isError(onecall)) continue;
                        links.push([onecall, member, link]);
                    }
                    if (Date.now() - lastUpdate >= 1000) {
                        const loadingEmbed = new WeatherReply(command).addEmbeds(WeatherEmbed.loadingEmbed(allLinks.length, i + 1));
                        lastUpdate = (await command.editReply(loadingEmbed)).createdTimestamp;
                    }
                }
                if (!links.length) return command.followUp(new WeatherReply(command).addEmbeds(WeatherEmbed.missingLinkedMembersEmbed()));
                const viewData = { page: 0, perPage: 40, totalPages: Math.floor(links.length / 40) + 1, order: WeatherTempsOrder.Hottest };
                const embed = new WeatherReply(command)
                    .addWeatherServerTempsEmbed(links, viewData)
                    .addComponents(new WeatherMessageActionRow().addWeatherSelectMenu(viewData.order))
                    .addWeatherPageActionRow(viewData);
                const message = await command.editReply(embed);
                const collector = Util.createComponentCollector(command.client, message);
                collector.on('collect', async component => {
                    await component.deferUpdate();
                    if (component.isButton() && component.customId === PageableComponentID.NEXT_PAGE) { viewData.page++; }
                    if (component.isButton() && component.customId === PageableComponentID.PREVIOUS_PAGE) { viewData.page--; }
                    if (component.isSelectMenu() && component.customId === WeatherComponentID.Order) { viewData.order = component.values[0] as WeatherTempsOrder; }
                    viewData.page = viewData.page % (Math.floor(links.length / viewData.perPage) + 1);
                    viewData.page = viewData.page >= 0 ? viewData.page : (Math.floor(links.length / viewData.perPage) + 1) + viewData.page;
                    const embed = new WeatherReply(command)
                        .addWeatherServerTempsEmbed(links, viewData)
                        .addComponents(new WeatherMessageActionRow().addWeatherSelectMenu(viewData.order))
                        .addWeatherPageActionRow(viewData);
                    await component.editReply(embed);
                });
                break;
            }
            case WeatherSubCommandName.User: {
                await command.deferReply();
                const user = (command.options.getUser('user') || command.user);
                const link = await this.database.selectLink(user, command.guild);
                if (!link) return command.followUp(new WeatherReply(command).addEmbeds(WeatherEmbed.missingLinkEmbed(user)));
                const location: LocationQuery = {
                    city_name: link.name,
                    ...(link.state && { state_code: link.state }),
                    ...(link.country && { country_code: link.country })
                };
                const weather = await this.fetchWeather(location);
                if (!weather) return command.followUp(new WeatherReply(command).addEmbeds(WeatherEmbed.unknownLocationEmbed(location)));
                if (this.openweather.isError(weather)) return command.followUp(new WeatherReply(command).addEmbeds(WeatherEmbed.openWeatherAPIErrorEmbed(weather)));
                const embed = new WeatherReply(command)
                    .addWeatherCurrentEmbed(weather)
                    .addWeatherActionRow(this.chooseButtons(weather, WeatherComponentID.Current), weather);
                const message = await command.followUp(embed);
                const collector = Util.createComponentCollector(command.client, message);
                collector.on('collect', this.createCollectorFunction(weather));
                break;
            }
            case WeatherSubCommandName.Location: {
                await command.deferReply();
                const city_name = command.options.getString(WeatherSlashCommandOption.CityName, true);
                const state_code = command.options.getString(WeatherSlashCommandOption.StateCode);
                const country_code = command.options.getString(WeatherSlashCommandOption.CountryCode);
                const location: LocationQuery = {
                    city_name: city_name.trim(),
                    ...(state_code && { state_code: state_code.trim() }),
                    ...(country_code && { country_code: country_code.trim() })
                };
                const weather = await this.fetchWeather(location);
                if (!weather) return command.followUp(new WeatherReply(command).addEmbeds(WeatherEmbed.unknownLocationEmbed(location)));
                if (this.openweather.isError(weather)) return command.followUp(new WeatherReply(command).addEmbeds(WeatherEmbed.openWeatherAPIErrorEmbed(weather)));
                const embed = new WeatherReply(command)
                    .addWeatherCurrentEmbed(weather)
                    .addWeatherActionRow(this.chooseButtons(weather, WeatherComponentID.Current), weather);
                const message = await command.followUp(embed);
                const collector = Util.createComponentCollector(command.client, message);
                collector.on('collect', this.createCollectorFunction(weather));
                break;
            }
            case WeatherSubCommandName.Link: {
                const user = (command.options.getUser('user') || command.user);
                if (command.user.id !== user.id && !Util.isAdminOrOwner(command)) {
                    const replyOptions = new WeatherReply(command)
                        .addEmbeds(WeatherEmbed.missingAdminEmbed())
                        .setEphemeral(true);
                    return command.reply(replyOptions);
                }
                await command.deferReply();
                const city_name = command.options.getString(WeatherSlashCommandOption.CityName, true);
                const state_code = command.options.getString(WeatherSlashCommandOption.StateCode);
                const country_code = command.options.getString(WeatherSlashCommandOption.CountryCode);
                const location: LocationQuery = {
                    city_name: city_name.trim(),
                    ...(state_code && { state_code: state_code.trim() }),
                    ...(country_code && { country_code: country_code.trim() })
                };
                const weather = await this.fetchWeather(location);
                if (!weather) return command.followUp(new WeatherReply(command).addEmbeds(WeatherEmbed.unknownLocationEmbed(location)));
                if (this.openweather.isError(weather)) return command.followUp(new WeatherReply(command).addEmbeds(WeatherEmbed.openWeatherAPIErrorEmbed(weather)));
                await this.database.insertLink(user, weather, command.guild);
                const embed = new WeatherReply(command)
                    .addEmbeds(WeatherEmbed.linkedEmbed(user, weather))
                    .addWeatherActionRow(this.chooseButtons(weather), weather);
                const message = await command.followUp(embed);
                const collector = Util.createComponentCollector(command.client, message);
                collector.on('collect', this.createCollectorFunction(weather));
                break;
            }
            case WeatherSubCommandName.Unlink: {
                const user = (command.options.getUser('user') || command.user);
                if (command.user.id !== user.id && !Util.isAdminOrOwner(command)) {
                    const replyOptions = new WeatherReply(command)
                        .addEmbeds(WeatherEmbed.missingAdminEmbed())
                        .setEphemeral(true);
                    return command.reply(replyOptions);
                }
                await command.deferReply();
                await this.database.deleteLink(user, command.guild);
                const embed = new WeatherReply(command)
                    .addEmbeds(WeatherEmbed.unlinkedEmbed(user))
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
            if (component.isButton()) {
                switch (component.customId) {
                    case WeatherComponentID.Current: {
                        await component.deferUpdate();
                        const embed = new WeatherReply(component).addWeatherCurrentEmbed(weather)
                            .addWeatherActionRow(this.chooseButtons(weather, WeatherComponentID.Current), weather);
                        await component.editReply(embed);
                        break;
                    }
                    case WeatherComponentID.Forecast: {
                        await component.deferUpdate();
                        const embed = new WeatherReply(component).addWeatherForecastEmbed(weather)
                            .addWeatherActionRow(this.chooseButtons(weather, WeatherComponentID.Forecast), weather);
                        await component.editReply(embed);
                        break;
                    }
                    case WeatherComponentID.AirQuality: {
                        await component.deferUpdate();
                        const embed = new WeatherReply(component).addWeatherAirPollutionEmbed(weather)
                            .addWeatherActionRow(this.chooseButtons(weather, WeatherComponentID.AirQuality), weather);
                        await component.editReply(embed);
                        break;
                    }
                    case WeatherComponentID.Warning: {
                        await component.deferUpdate();
                        const embed = new WeatherReply(component).addWeatherAlertEmbed(weather)
                            .addWeatherActionRow(this.chooseButtons(weather, WeatherComponentID.Warning), weather);
                        await component.editReply(embed);
                        break;
                    }
                }
            }
        };
    }

    private chooseButtons(weather: OpenWeatherData, currentPage?: WeatherComponentID): WeatherComponentID[] {
        const weatherButtons: WeatherComponentID[] = [
            WeatherComponentID.Current,
            WeatherComponentID.Forecast,
            WeatherComponentID.AirQuality,
            ...(weather.alerts && weather.alerts.length ? [WeatherComponentID.Warning] : [])
        ];
        currentPage && weatherButtons.splice(weatherButtons.indexOf(currentPage), 1);
        return weatherButtons;
    }
}
