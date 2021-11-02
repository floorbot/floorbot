import { CommandInteraction, GuildMember, Interaction, InteractionReplyOptions, Message, MessageActionRow, MessageComponentInteraction, Guild, GuildChannel, Util } from 'discord.js';
import { AirPollutionData, GeocodeData, LocationData, OneCallData, OpenWeatherAPI, WeatherAPIError } from './api/OpenWeatherAPI';
import { WeatherSelectMenu, WeatherSelectMenuID, WeatherTempsOrder } from './components/WeatherSelectMenu';
import { WeatherCommandData, WeatherSubCommandName } from './WeatherCommandData';
import { WeatherButton, WeatherButtonID } from './components/WeatherButton';
import { WeatherDatabase, WeatherLinkSchema } from './WeatherDatabase';
import { HandlerReply } from '../../../components/HandlerReply';
import { HandlerClient } from '../../../discord/HandlerClient';
import { WeatherEmbed } from './components/WeatherEmbed';
import { BaseHandler } from '../../BaseHandler';

export type OpenWeatherData = OneCallData & GeocodeData & AirPollutionData;

export class WeatherHandler extends BaseHandler {

    constructor() {
        super({
            id: 'weather',
            group: 'Fun',
            global: false,
            nsfw: false,
            data: WeatherCommandData
        });
    }

    public async execute(command: CommandInteraction): Promise<any> {
        const subCommand = command.options.getSubcommand();
        switch (subCommand) {
            case WeatherSubCommandName.LOCATION: {
                await command.deferReply();
                const city_name = command.options.getString('city_name', true);
                const state_code = command.options.getString('state_code');
                const country_code = command.options.getString('country_code');
                const location: LocationData = {
                    city_name: city_name.trim(),
                    ...(state_code && { state_code: state_code.trim() }),
                    ...(country_code && { country_code: country_code.trim() })
                };
                const weather = await this.fetchWeather(location);
                if (!weather) return command.followUp(WeatherEmbed.getUnknownLocationEmbed(command, location).toReplyOptions());
                if (OpenWeatherAPI.isError(weather)) return command.followUp(WeatherEmbed.getAPIErrorEmbed(command, weather).toReplyOptions());
                const replyOptions = this.createCurrentResponse(command, weather);
                const message = await command.followUp(replyOptions) as Message;
                const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 10 });
                collector.on('collect', this.createCollectorFunction(weather));
                collector.on('end', Util.deleteComponentsOnEnd(message));
                break;
            }
            case WeatherSubCommandName.USER: {
                await command.deferReply();
                const member = (command.options.getMember('user') || command.member) as GuildMember;
                const link = await WeatherDatabase.fetchLink(member);
                if (!link) return command.followUp(WeatherEmbed.getMissingParamsEmbed(command, member).toReplyOptions());
                const location: LocationData = {
                    city_name: link.name,
                    ...(link.state && { state_code: link.state }),
                    ...(link.country && { country_code: link.country })
                };
                const weather = await this.fetchWeather(location);
                if (!weather) return command.followUp(WeatherEmbed.getUnknownLocationEmbed(command, location).toReplyOptions());
                if (OpenWeatherAPI.isError(weather)) return command.followUp(WeatherEmbed.getAPIErrorEmbed(command, weather).toReplyOptions());
                const replyOptions = this.createCurrentResponse(command, weather);
                const message = await command.followUp(replyOptions) as Message;
                const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 10 });
                collector.on('collect', this.createCollectorFunction(weather));
                collector.on('end', Util.deleteComponentsOnEnd(message));
                break;
            }
            case WeatherSubCommandName.SERVER_TEMPS: {
                await command.deferReply();
                const { channel, guild } = <{ channel: GuildChannel, guild: Guild }>command;
                const links: [OneCallData, GuildMember, WeatherLinkSchema][] = new Array();
                for (const link of await WeatherDatabase.fetchAllLinks(guild)) {
                    const member = channel.members.get(link.user_id.toString());
                    if (member) {
                        const onecall = await OpenWeatherAPI.oneCall(link);
                        if (OpenWeatherAPI.isError(onecall)) continue;
                        links.push([onecall, member, link])
                    };
                }
                if (!links.length) return command.followUp(WeatherEmbed.getNoLinkedMembersEmbed(command, channel).toReplyOptions());
                const viewData = { page: 1, perPage: 20, order: WeatherTempsOrder.HOTTEST };
                const replyOptions = this.createServerTempsResponse(command, links, viewData);
                const message = await command.followUp(replyOptions) as Message;
                const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 10 });
                collector.on('collect', async component => {
                    await component.deferUpdate();
                    if (component.isButton() && component.customId === WeatherButtonID.NEXT_PAGE) { viewData.page = viewData.page + 1; }
                    if (component.isButton() && component.customId === WeatherButtonID.PREVIOUS_PAGE) { viewData.page = viewData.page - 1; }
                    if (component.isSelectMenu() && component.customId === WeatherSelectMenuID.ORDER) { viewData.order = component.values[0] as WeatherTempsOrder; }
                    const replyOptions = this.createServerTempsResponse(component, links, viewData);
                    await component.editReply(replyOptions);
                });
                collector.on('end', Util.deleteComponentsOnEnd(message));
                break;
            }
            case WeatherSubCommandName.LINK: {
                const member = (command.options.getMember('user') || command.member) as GuildMember;
                if (!Util.isAdminOrOwner(command)) return command.reply(HandlerReply.createAdminOrOwnerReply(command));
                await command.deferReply();
                const city_name = command.options.getString('city_name', true);
                const state_code = command.options.getString('state_code');
                const country_code = command.options.getString('country_code');
                const location: LocationData = {
                    city_name: city_name.trim(),
                    ...(state_code && { state_code: state_code.trim() }),
                    ...(country_code && { country_code: country_code.trim() })
                };
                const weather = await this.fetchWeather(location);
                if (!weather) return command.followUp(WeatherEmbed.getUnknownLocationEmbed(command, location).toReplyOptions());
                if (OpenWeatherAPI.isError(weather)) return command.followUp(WeatherEmbed.getAPIErrorEmbed(command, weather).toReplyOptions());
                await WeatherDatabase.setLink(member, weather);
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
                collector.on('end', Util.deleteComponentsOnEnd(message));
                break;
            }
            case WeatherSubCommandName.UNLINK: {
                const member = (command.options.getMember('user') || command.member) as GuildMember;
                if (!Util.isAdminOrOwner(command)) return command.reply(HandlerReply.createAdminOrOwnerReply(command));
                await command.deferReply();
                await WeatherDatabase.deleteLink(member);
                const embed = WeatherEmbed.getUnlinkedEmbed(command, member)
                return command.followUp({ embeds: [embed], components: [] });
            }
        }
    }

    private async fetchWeather(location: LocationData): Promise<OpenWeatherData | WeatherAPIError | null> {
        const geocoding = await OpenWeatherAPI.geocoding(location);
        if (OpenWeatherAPI.isError(geocoding)) return geocoding;
        if (!geocoding.length) return null;
        const onecall = await OpenWeatherAPI.oneCall(geocoding[0]!);
        if (OpenWeatherAPI.isError(onecall)) return onecall;
        const air = await OpenWeatherAPI.airPollution(geocoding[0]!);
        if (OpenWeatherAPI.isError(air)) return air;
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

    private createServerTempsResponse(interaction: Interaction, links: [OneCallData, GuildMember, WeatherLinkSchema][], viewData: { page: number, perPage: number, order: WeatherTempsOrder }): InteractionReplyOptions {
        if (viewData.order === WeatherTempsOrder.HOTTEST) links.sort((link1, link2) => { return link2[0].current.temp - link1[0].current.temp });
        else if (viewData.order === WeatherTempsOrder.COLDEST) links.sort((link1, link2) => { return link1[0].current.temp - link2[0].current.temp });
        else if (viewData.order === WeatherTempsOrder.HUMIDITY) links.sort((link1, link2) => { return link2[0].current.humidity - link1[0].current.humidity });
        else if (viewData.order === WeatherTempsOrder.TIMEZONE) links.sort((link1, link2) => { return link2[0].timezone_offset - link1[0].timezone_offset });
        const sliced = links.slice((viewData.page - 1) * viewData.perPage, viewData.page * viewData.perPage);
        if (!sliced.length && viewData.page !== 1) return this.createServerTempsResponse(interaction, links, { ...viewData, page: 1 });
        const embed = WeatherEmbed.getServerTempsEmbed(interaction, sliced);
        const orderActionRow = new MessageActionRow().addComponents([WeatherSelectMenu.createOrderSelectMenu(viewData.order)]);
        const pageActionRow = new MessageActionRow();
        if ((viewData.page - 1 > 0) && (links.length / viewData.perPage) >= viewData.page - 1) pageActionRow.addComponents(WeatherButton.createPreviousPageButton(viewData.page - 1));
        if ((viewData.page + 1 > 0) && (links.length / viewData.perPage) >= viewData.page + 1) pageActionRow.addComponents(WeatherButton.createNextPageButton(viewData.page + 1));
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
        await super.setup(client);
        await WeatherDatabase.setup(client).then(() => true);
    }
}
