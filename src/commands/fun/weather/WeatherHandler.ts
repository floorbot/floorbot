import { CommandInteraction, GuildMember, Interaction, InteractionReplyOptions, Message, MessageActionRow, Permissions, MessageComponentInteraction, Guild, GuildChannel } from 'discord.js';
import { AirPollutionData, GeocodeData, LocationData, OneCallData, OpenWeatherAPI, WeatherAPIError } from './api/OpenWeatherAPI';
import { WeatherSelectMenu, WeatherTempsOrder } from './components/WeatherSelectMenu';
import { WeatherCommandData, WeatherSubCommandName } from './WeatherCommandData';
import { WeatherButton, WeatherButtonTypes } from './components/WeatherButton';
import { WeatherDatabase, WeatherLinkSchema } from './WeatherDatabase';
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

    public async execute(interaction: CommandInteraction): Promise<any> {
        const subCommand = interaction.options.getSubcommand();
        switch (subCommand) {
            case WeatherSubCommandName.LOCATION: {
                await interaction.deferReply();
                const city_name = interaction.options.getString('city_name', true);
                const state_code = interaction.options.getString('state_code');
                const country_code = interaction.options.getString('country_code');
                const location: LocationData = {
                    city_name: city_name.trim(),
                    ...(state_code && { state_code: state_code.trim() }),
                    ...(country_code && { country_code: country_code.trim() })
                };
                const weather = await this.fetchWeather(location);
                if (!weather) return interaction.followUp(WeatherEmbed.getUnknownLocationEmbed(interaction, location).toReplyOptions());
                if (OpenWeatherAPI.isError(weather)) return interaction.followUp(WeatherEmbed.getAPIErrorEmbed(interaction, weather).toReplyOptions());
                const replyOptions = this.createCurrentResponse(interaction, weather);
                const message = await interaction.followUp(replyOptions) as Message;
                const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 10 });
                collector.on('collect', this.createCollectorFunction(weather));
                collector.on('end', this.createEnderFunction(message));
                return message;
            }
            case WeatherSubCommandName.USER: {
                await interaction.deferReply();
                const member = (interaction.options.getMember('user') || interaction.member) as GuildMember;
                const link = await WeatherDatabase.fetchLink(member);
                if (!link) return interaction.followUp(WeatherEmbed.getMissingParamsEmbed(interaction, member).toReplyOptions());
                const location: LocationData = {
                    city_name: link.name,
                    ...(link.state && { state_code: link.state }),
                    ...(link.country && { country_code: link.country })
                };
                const weather = await this.fetchWeather(location);
                if (!weather) return interaction.followUp(WeatherEmbed.getUnknownLocationEmbed(interaction, location).toReplyOptions());
                if (OpenWeatherAPI.isError(weather)) return interaction.followUp(WeatherEmbed.getAPIErrorEmbed(interaction, weather).toReplyOptions());
                const replyOptions = this.createCurrentResponse(interaction, weather);
                const message = await interaction.followUp(replyOptions) as Message;
                const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 10 });
                collector.on('collect', this.createCollectorFunction(weather));
                collector.on('end', this.createEnderFunction(message));
                return message;
            }
            case WeatherSubCommandName.SERVER_TEMPS: {
                await interaction.deferReply();
                const { channel, guild } = <{ channel: GuildChannel, guild: Guild }>interaction;
                const links: [OneCallData, GuildMember, WeatherLinkSchema][] = new Array();
                for (const link of await WeatherDatabase.fetchAllLinks(guild)) {
                    const member = channel.members.get(link.user_id.toString());
                    if (member) {
                        const onecall = await OpenWeatherAPI.oneCall(link);
                        if (OpenWeatherAPI.isError(onecall)) continue;
                        links.push([onecall, member, link])
                    };
                }
                if (!links.length) return interaction.followUp(WeatherEmbed.getNoLinkedMembersEmbed(interaction, channel).toReplyOptions());
                const viewData = { page: 1, perPage: 20, order: WeatherTempsOrder.HOTTEST };
                const replyOptions = this.createServerTempsResponse(interaction, links, viewData);
                const message = await interaction.followUp(replyOptions) as Message;
                const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 10 });
                collector.on('collect', async component => {
                    await component.deferUpdate();
                    if (component.isButton() && component.customId === 'next_page') { viewData.page = viewData.page + 1; }
                    if (component.isButton() && component.customId === 'previous_page') { viewData.page = viewData.page - 1; }
                    if (component.isSelectMenu() && component.customId === 'order') { viewData.order = component.values[0] as WeatherTempsOrder; }
                    const replyOptions = this.createServerTempsResponse(component, links, viewData);
                    await component.editReply(replyOptions);
                });
                collector.on('end', this.createEnderFunction(message));
                return message;
            }
            case WeatherSubCommandName.LINK: {
                const member = (interaction.options.getMember('user') || interaction.member) as GuildMember;
                if (member !== interaction.member && await this.replyIfAdmin(interaction)) return;
                await interaction.deferReply();
                const city_name = interaction.options.getString('city_name', true);
                const state_code = interaction.options.getString('state_code');
                const country_code = interaction.options.getString('country_code');
                const location: LocationData = {
                    city_name: city_name.trim(),
                    ...(state_code && { state_code: state_code.trim() }),
                    ...(country_code && { country_code: country_code.trim() })
                };
                const weather = await this.fetchWeather(location);
                if (!weather) return interaction.followUp(WeatherEmbed.getUnknownLocationEmbed(interaction, location).toReplyOptions());
                if (OpenWeatherAPI.isError(weather)) return interaction.followUp(WeatherEmbed.getAPIErrorEmbed(interaction, weather).toReplyOptions());
                await WeatherDatabase.setLink(member, weather);
                const embed = WeatherEmbed.getLinkedEmbed(interaction, weather, member);
                const actionRow: MessageActionRow = new MessageActionRow().addComponents([
                    WeatherButton.getWeatherButton(WeatherButtonTypes.CURRENT),
                    WeatherButton.getWeatherButton(WeatherButtonTypes.FORECAST),
                    WeatherButton.getWeatherButton(WeatherButtonTypes.AIR_QUALITY),
                    WeatherButton.getViewMapButton(weather)
                ]);
                const message = await interaction.followUp({ embeds: [embed], components: [actionRow] }) as Message;
                const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 10 });
                collector.on('collect', this.createCollectorFunction(weather));
                collector.on('end', this.createEnderFunction(message));
                return message;
            }
            case WeatherSubCommandName.UNLINK: {
                const member = (interaction.options.getMember('user') || interaction.member) as GuildMember;
                if (member !== interaction.member && await this.replyIfAdmin(interaction)) return;
                await interaction.deferReply();
                await WeatherDatabase.deleteLink(member);
                const embed = WeatherEmbed.getUnlinkedEmbed(interaction, member)
                return interaction.followUp({ embeds: [embed], components: [] });
            }
            default: { throw interaction }
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

    private createCollectorFunction(weather: OpenWeatherData): (component: MessageComponentInteraction) => any {
        return async (component: MessageComponentInteraction) => {
            if (component.isButton()) {
                switch (component.customId as WeatherButtonTypes) {
                    case WeatherButtonTypes.CURRENT: {
                        await component.deferUpdate();
                        const replyOptions = this.createCurrentResponse(component, weather);
                        return await component.editReply(replyOptions) as Message;
                    }
                    case WeatherButtonTypes.FORECAST: {
                        await component.deferUpdate();
                        const replyOptions = this.createForecastResponse(component, weather);
                        return await component.editReply(replyOptions) as Message;
                    }
                    case WeatherButtonTypes.AIR_QUALITY: {
                        await component.deferUpdate();
                        const replyOptions = this.createAirPollutionResponse(component, weather);
                        return await component.editReply(replyOptions) as Message;
                    }
                    case WeatherButtonTypes.WARNING: {
                        await component.deferUpdate();
                        const embed = WeatherEmbed.getAlertEmbed(component, weather);
                        const actionRow: MessageActionRow = new MessageActionRow().addComponents([
                            WeatherButton.getWeatherButton(WeatherButtonTypes.CURRENT),
                            WeatherButton.getWeatherButton(WeatherButtonTypes.FORECAST),
                            WeatherButton.getWeatherButton(WeatherButtonTypes.AIR_QUALITY),
                            WeatherButton.getViewMapButton(weather)
                        ]);
                        return await component.editReply({ embeds: [embed], components: [actionRow] }) as Message;
                    }
                    default: throw 'Unknown Button';
                }
            }
            throw 'Unknown Component';
        }
    }

    private createServerTempsResponse(interaction: Interaction, links: [OneCallData, GuildMember, WeatherLinkSchema][], viewData: { page: number, perPage: number, order: WeatherTempsOrder }): InteractionReplyOptions {
        if (viewData.order === WeatherTempsOrder.HOTTEST) links.sort((link1, link2) => { return link2[0].current.temp - link1[0].current.temp });
        if (viewData.order === WeatherTempsOrder.COLDEST) links.sort((link1, link2) => { return link1[0].current.temp - link2[0].current.temp });
        if (viewData.order === WeatherTempsOrder.HUMIDITY) links.sort((link1, link2) => { return link2[0].current.humidity - link1[0].current.humidity });
        if (viewData.order === WeatherTempsOrder.TIMEZONE) links.sort((link1, link2) => { return link2[0].timezone_offset - link1[0].timezone_offset });
        const sliced = links.slice((viewData.page - 1) * viewData.perPage, viewData.page * viewData.perPage);
        if (!sliced.length && viewData.page !== 1) return this.createServerTempsResponse(interaction, links, { ...viewData, page: 1 });
        const embed = WeatherEmbed.getServerTempsEmbed(interaction, sliced);
        const orderActionRow = new MessageActionRow().addComponents([WeatherSelectMenu.getOrderSelectMenu(viewData.order)]);
        const pageActionRow = new MessageActionRow();
        if ((viewData.page - 1 > 0) && (links.length / viewData.perPage) >= viewData.page - 1) pageActionRow.addComponents(WeatherButton.getPreviousPageButton(viewData.page - 1));
        if ((viewData.page + 1 > 0) && (links.length / viewData.perPage) >= viewData.page + 1) pageActionRow.addComponents(WeatherButton.getNextPageButton(viewData.page + 1));
        const components = pageActionRow.components.length ? [orderActionRow, pageActionRow] : [orderActionRow];
        return { embeds: [embed], components: components };
    }

    private createCurrentResponse(interaction: Interaction, weather: OpenWeatherData): InteractionReplyOptions {
        const embed = WeatherEmbed.getCurrentEmbed(interaction, weather);
        const actionRow: MessageActionRow = new MessageActionRow().addComponents([
            WeatherButton.getWeatherButton(WeatherButtonTypes.FORECAST),
            WeatherButton.getWeatherButton(WeatherButtonTypes.AIR_QUALITY),
            ...(weather.alerts && weather.alerts.length ? [WeatherButton.getWeatherButton(WeatherButtonTypes.WARNING)] : []),
            WeatherButton.getViewMapButton(weather)
        ]);
        return { embeds: [embed], components: [actionRow] };
    }

    private createForecastResponse(interaction: Interaction, weather: OpenWeatherData): InteractionReplyOptions {
        const embed = WeatherEmbed.getForecastEmbed(interaction, weather);
        const actionRow: MessageActionRow = new MessageActionRow().addComponents([
            WeatherButton.getWeatherButton(WeatherButtonTypes.CURRENT),
            WeatherButton.getWeatherButton(WeatherButtonTypes.AIR_QUALITY),
            ...(weather.alerts && weather.alerts.length ? [WeatherButton.getWeatherButton(WeatherButtonTypes.WARNING)] : []),
            WeatherButton.getViewMapButton(weather)
        ]);
        return { embeds: [embed], components: [actionRow] };
    }

    private createAirPollutionResponse(interaction: Interaction, weather: OpenWeatherData): InteractionReplyOptions {
        const embed = WeatherEmbed.getAirPullutionEmbed(interaction, weather);
        const actionRow: MessageActionRow = new MessageActionRow().addComponents([
            WeatherButton.getWeatherButton(WeatherButtonTypes.CURRENT),
            WeatherButton.getWeatherButton(WeatherButtonTypes.FORECAST),
            ...(weather.alerts && weather.alerts.length ? [WeatherButton.getWeatherButton(WeatherButtonTypes.WARNING)] : []),
            WeatherButton.getViewMapButton(weather)
        ]);
        return { embeds: [embed], components: [actionRow] };
    }

    private async replyIfAdmin(context: CommandInteraction | MessageComponentInteraction): Promise<Message | null> {
        if (!(context.member as GuildMember).permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            const response = this.getEmbedTemplate(context).setDescription(`Sorry! Only admins can use the admin command`).toReplyOptions(true);
            return await context.reply({ ...response, fetchReply: true }) as Message;
        }
        return null;
    }

    public override async setup(client: HandlerClient): Promise<any> {
        await super.setup(client);
        await WeatherDatabase.setup(client).then(() => true);
    }
}
