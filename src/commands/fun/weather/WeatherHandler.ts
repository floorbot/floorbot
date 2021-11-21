import { CommandInteraction, GuildMember, Interaction, InteractionReplyOptions, Message, MessageActionRow, MessageComponentInteraction, Guild, GuildChannel } from 'discord.js';
import { AirPollutionData, GeocodeData, LocationQuery, OneCallData, OpenWeatherAPI, WeatherAPIError } from './api/OpenWeatherAPI.js';
import { WeatherSelectMenu, WeatherSelectMenuID, WeatherTempsOrder } from './components/WeatherSelectMenu.js';
import { ChatInputHandler } from '../../../discord/handler/abstracts/ChatInputHandler.js';
import { WeatherCommandData, WeatherSubCommandName } from './WeatherCommandData.js';
import { WeatherButton, WeatherButtonID } from './components/WeatherButton.js';
import { HandlerClient } from '../../../discord/handler/HandlerClient.js';
import { WeatherDatabase, WeatherLinkRow } from './db/WeatherDatabase.js';
import { HandlerUtil } from '../../../discord/handler/HandlerUtil.js';
import { HandlerReplies } from '../../../helpers/HandlerReplies.js';
import { HandlerDB } from '../../../helpers/HandlerDatabase.js';
import { WeatherEmbed } from './components/WeatherEmbed.js';

export type OpenWeatherData = OneCallData & GeocodeData & AirPollutionData;

export class WeatherHandler extends ChatInputHandler {

    private readonly database: WeatherDatabase;
    private readonly openweather: OpenWeatherAPI;

    constructor(pool: HandlerDB, apiKey: string) {
        super({ group: 'Fun', global: false, nsfw: false, data: WeatherCommandData });
        this.database = new WeatherDatabase(pool);
        this.openweather = new OpenWeatherAPI(apiKey);
    }

    public async execute(command: CommandInteraction<'cached'>): Promise<any> {
        const subCommand = command.options.getSubcommand();
        switch (subCommand) {
            case WeatherSubCommandName.LOCATION: {
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
                if (!weather) return command.followUp(WeatherEmbed.getUnknownLocationEmbed(command, location).toReplyOptions());
                if (this.openweather.isError(weather)) return command.followUp(WeatherEmbed.getAPIErrorEmbed(command, weather).toReplyOptions());
                const replyOptions = this.createCurrentResponse(command, weather);
                const message = await command.followUp(replyOptions) as Message;
                const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 10 });
                collector.on('collect', this.createCollectorFunction(weather));
                collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
                break;
            }
            case WeatherSubCommandName.USER: {
                await command.deferReply();
                const member = (command.options.getMember('user') || command.member);
                const link = await this.database.fetchLink(member);
                if (!link) return command.followUp(WeatherEmbed.getMissingParamsEmbed(command, member).toReplyOptions());
                const location: LocationQuery = {
                    city_name: link.name,
                    ...(link.state && { state_code: link.state }),
                    ...(link.country && { country_code: link.country })
                };
                const weather = await this.fetchWeather(location);
                if (!weather) return command.followUp(WeatherEmbed.getUnknownLocationEmbed(command, location).toReplyOptions());
                if (this.openweather.isError(weather)) return command.followUp(WeatherEmbed.getAPIErrorEmbed(command, weather).toReplyOptions());
                const replyOptions = this.createCurrentResponse(command, weather);
                const message = await command.followUp(replyOptions) as Message;
                const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 10 });
                collector.on('collect', this.createCollectorFunction(weather));
                collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
                break;
            }
            case WeatherSubCommandName.SERVER_TEMPS: {
                await command.deferReply();
                const { channel, guild } = <{ channel: GuildChannel, guild: Guild }>command;
                const links: [OneCallData, GuildMember, WeatherLinkRow][] = new Array();
                const allLinks = await this.database.fetchAllLinks(guild);
                let loadingReplyOptions = WeatherEmbed.getLoadingEmbed(command, allLinks.length, 0).toReplyOptions();
                let lastUpdate = (await command.followUp(loadingReplyOptions) as Message).createdTimestamp;
                for (const [i, link] of allLinks.entries()) {
                    console.log(link)
                    const member = channel.members.get(link.user_id.toString());
                    if (member) {
                        const onecall = await this.openweather.oneCall(link);
                        if (this.openweather.isError(onecall)) continue;
                        links.push([onecall, member, link]);
                    }
                    if (Date.now() - lastUpdate >= 1000) {
                        loadingReplyOptions = WeatherEmbed.getLoadingEmbed(command, allLinks.length, i + 1).toReplyOptions();
                        lastUpdate = (await command.editReply(loadingReplyOptions) as Message).createdTimestamp;
                    }
                }
                if (!links.length) return command.followUp(WeatherEmbed.getNoLinkedMembersEmbed(command, channel).toReplyOptions());
                const viewData = { page: 1, perPage: 40, order: WeatherTempsOrder.HOTTEST };
                const replyOptions = this.createServerTempsResponse(command, links, viewData);
                const message = await command.editReply(replyOptions) as Message;
                const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 10 });
                collector.on('collect', async component => {
                    await component.deferUpdate();
                    if (component.isButton() && component.customId === WeatherButtonID.NEXT_PAGE) { viewData.page = viewData.page + 1; }
                    if (component.isButton() && component.customId === WeatherButtonID.PREVIOUS_PAGE) { viewData.page = viewData.page - 1; }
                    if (component.isSelectMenu() && component.customId === WeatherSelectMenuID.ORDER) { viewData.order = component.values[0] as WeatherTempsOrder; }
                    const replyOptions = this.createServerTempsResponse(component, links, viewData);
                    await component.editReply(replyOptions);
                });
                collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
                break;
            }
            case WeatherSubCommandName.LINK: {
                const member = (command.options.getMember('user') || command.member);
                if (command.member !== member && !HandlerUtil.isAdminOrOwner(command.member)) return command.reply(HandlerReplies.createAdminOrOwnerReply(command));
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
                if (!weather) return command.followUp(WeatherEmbed.getUnknownLocationEmbed(command, location).toReplyOptions());
                if (this.openweather.isError(weather)) return command.followUp(WeatherEmbed.getAPIErrorEmbed(command, weather).toReplyOptions());
                await this.database.setLink(member, weather);
                const embed = WeatherEmbed.getLinkedEmbed(command, weather, member);
                const actionRow: MessageActionRow = new MessageActionRow().addComponents([
                    WeatherButton.createWeatherButton(WeatherButtonID.CURRENT),
                    WeatherButton.createWeatherButton(WeatherButtonID.FORECAST),
                    WeatherButton.createWeatherButton(WeatherButtonID.AIR_QUALITY),
                    WeatherButton.createViewMapButton(weather)
                ]);
                const message = await command.followUp({ embeds: [embed], components: [actionRow] }) as Message;
                const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 10 });
                collector.on('collect', this.createCollectorFunction(weather));
                collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
                break;
            }
            case WeatherSubCommandName.UNLINK: {
                const member = (command.options.getMember('user') || command.member);
                if (command.member !== member && !HandlerUtil.isAdminOrOwner(command.member)) return command.reply(HandlerReplies.createAdminOrOwnerReply(command));
                await command.deferReply();
                await this.database.deleteLink(member);
                const embed = WeatherEmbed.getUnlinkedEmbed(command, member)
                return command.followUp({ embeds: [embed], components: [] });
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
                        case WeatherButtonID.CURRENT: {
                            await component.deferUpdate();
                            const replyOptions = this.createCurrentResponse(component, weather);
                            await component.editReply(replyOptions);
                            break;
                        }
                        case WeatherButtonID.FORECAST: {
                            await component.deferUpdate();
                            const replyOptions = this.createForecastResponse(component, weather);
                            await component.editReply(replyOptions);
                            break;
                        }
                        case WeatherButtonID.AIR_QUALITY: {
                            await component.deferUpdate();
                            const replyOptions = this.createAirPollutionResponse(component, weather);
                            await component.editReply(replyOptions);
                            break;
                        }
                        case WeatherButtonID.WARNING: {
                            await component.deferUpdate();
                            const embed = WeatherEmbed.getAlertEmbed(component, weather);
                            const actionRow: MessageActionRow = new MessageActionRow().addComponents([
                                WeatherButton.createWeatherButton(WeatherButtonID.CURRENT),
                                WeatherButton.createWeatherButton(WeatherButtonID.FORECAST),
                                WeatherButton.createWeatherButton(WeatherButtonID.AIR_QUALITY),
                                WeatherButton.createViewMapButton(weather)
                            ]);
                            await component.editReply({ embeds: [embed], components: [actionRow] });
                            break;
                        }
                    }
                }
            } catch { }
        }
    }

    private createServerTempsResponse(interaction: Interaction, links: [OneCallData, GuildMember, WeatherLinkRow][], viewData: { page: number, perPage: number, order: WeatherTempsOrder }): InteractionReplyOptions {
        if (viewData.order === WeatherTempsOrder.HOTTEST) links.sort((link1, link2) => { return link2[0].current.temp - link1[0].current.temp });
        else if (viewData.order === WeatherTempsOrder.COLDEST) links.sort((link1, link2) => { return link1[0].current.temp - link2[0].current.temp });
        else if (viewData.order === WeatherTempsOrder.HUMIDITY) links.sort((link1, link2) => { return link2[0].current.humidity - link1[0].current.humidity });
        else if (viewData.order === WeatherTempsOrder.TIMEZONE) links.sort((link1, link2) => { return link2[0].timezone_offset - link1[0].timezone_offset });
        const sliced = links.slice((viewData.page - 1) * viewData.perPage, viewData.page * viewData.perPage);
        if (!sliced.length && viewData.page !== 1) return this.createServerTempsResponse(interaction, links, { ...viewData, page: 1 });
        const embed = WeatherEmbed.getServerTempsEmbed(interaction, sliced);
        const orderActionRow = new MessageActionRow().addComponents([WeatherSelectMenu.createOrderSelectMenu(viewData.order)]);
        const pageActionRow = new MessageActionRow();
        if ((viewData.page - 1 > 0) && Math.ceil(links.length / viewData.perPage) >= viewData.page - 1) pageActionRow.addComponents(WeatherButton.createPreviousPageButton(viewData.page - 1));
        if ((viewData.page + 1 > 0) && Math.ceil(links.length / viewData.perPage) >= viewData.page + 1) pageActionRow.addComponents(WeatherButton.createNextPageButton(viewData.page + 1));
        const components = pageActionRow.components.length ? [orderActionRow, pageActionRow] : [orderActionRow];
        return { embeds: [embed], components: components };
    }

    private createCurrentResponse(interaction: Interaction, weather: OpenWeatherData): InteractionReplyOptions {
        const embed = WeatherEmbed.getCurrentEmbed(interaction, weather);
        const actionRow: MessageActionRow = new MessageActionRow().addComponents([
            WeatherButton.createWeatherButton(WeatherButtonID.FORECAST),
            WeatherButton.createWeatherButton(WeatherButtonID.AIR_QUALITY),
            ...(weather.alerts && weather.alerts.length ? [WeatherButton.createWeatherButton(WeatherButtonID.WARNING)] : []),
            WeatherButton.createViewMapButton(weather)
        ]);
        return { embeds: [embed], components: [actionRow] };
    }

    private createForecastResponse(interaction: Interaction, weather: OpenWeatherData): InteractionReplyOptions {
        const embed = WeatherEmbed.getForecastEmbed(interaction, weather);
        const actionRow: MessageActionRow = new MessageActionRow().addComponents([
            WeatherButton.createWeatherButton(WeatherButtonID.CURRENT),
            WeatherButton.createWeatherButton(WeatherButtonID.AIR_QUALITY),
            ...(weather.alerts && weather.alerts.length ? [WeatherButton.createWeatherButton(WeatherButtonID.WARNING)] : []),
            WeatherButton.createViewMapButton(weather)
        ]);
        return { embeds: [embed], components: [actionRow] };
    }

    private createAirPollutionResponse(interaction: Interaction, weather: OpenWeatherData): InteractionReplyOptions {
        const embed = WeatherEmbed.getAirPullutionEmbed(interaction, weather);
        const actionRow: MessageActionRow = new MessageActionRow().addComponents([
            WeatherButton.createWeatherButton(WeatherButtonID.CURRENT),
            WeatherButton.createWeatherButton(WeatherButtonID.FORECAST),
            ...(weather.alerts && weather.alerts.length ? [WeatherButton.createWeatherButton(WeatherButtonID.WARNING)] : []),
            WeatherButton.createViewMapButton(weather)
        ]);
        return { embeds: [embed], components: [actionRow] };
    }

    public override async setup(client: HandlerClient): Promise<any> {
        return super.setup(client).then(() => this.database.createTables()).then(() => true);
    }
}
