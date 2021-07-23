import { WeatherDatabase, OpenWeatherAPI, LocationData, WeatherCommandData, WeatherSubCommandName, WeatherEmbedFactory, WeatherCustomData, GuildHandlerGroup, WeatherButtonCustomData, WeatherTempsOrder, WeatherDisplayType, WeatherButtonFactory, WeatherSelectMenuFactory, GuildHandler } from '../../..';
import { InteractionReplyOptions, MessageActionRow, ButtonInteraction, GuildMember, CommandInteraction, TextChannel, Message, Guild, GuildChannel, SelectMenuInteraction } from 'discord.js';
import { CommandClient, HandlerContext, HandlerCustomData, HandlerResult } from 'discord.js-commands';
import { PoolConfig } from 'mariadb';

import * as nconf from 'nconf';
nconf.required(['OPEN_WEATHER_API_KEY']);


export class WeatherHandler extends GuildHandler<WeatherCustomData> {

    public readonly database: WeatherDatabase;
    public readonly api: OpenWeatherAPI;

    constructor(poolConfig: PoolConfig) {
        super({
            commandData: WeatherCommandData,
            group: GuildHandlerGroup.FUN,
            id: 'weather',
            nsfw: false
        });
        this.database = new WeatherDatabase(poolConfig);
        this.api = new OpenWeatherAPI(nconf.get('OPEN_WEATHER_API_KEY'));
    }

    public override encodeButton(customData: WeatherButtonCustomData): string {
        return JSON.stringify({
            d: customData.display.charAt(0),
            ...(customData.page && { page: customData.page }),
            ...(customData.name && {
                geo: [
                    customData.name,
                    customData.state || '',
                    customData.country || '',
                    customData.lat,
                    customData.lon
                ].join(',')
            })
        });
    }

    public override decodeButton(customId: string): WeatherButtonCustomData {
        const encoded = JSON.parse(customId);
        const geoParts = encoded.geo ? encoded.geo.split(',') : [];
        return {
            display: Object.values(WeatherDisplayType).find(name => name.charAt(0) === encoded.d)!,
            ...(encoded.page && { page: encoded.page }),
            ...(encoded.geo && {
                name: geoParts[0],
                ...(geoParts[1] && { state: geoParts[1] }),
                ...(geoParts[2] && { country: geoParts[2] }),
                lat: parseFloat(geoParts[3]),
                lon: parseFloat(geoParts[4]),
            })
        }
    }

    public async onCommand(interaction: CommandInteraction): Promise<any> {
        await interaction.defer();

        const subCommand = interaction.options.getSubCommand();
        const member = (interaction.options.getMember('user') || interaction.member) as GuildMember;
        const city_name = interaction.options.getString('city_name');
        const state_code = interaction.options.getString('state_code');
        const country_code = interaction.options.getString('country_code');
        const location: LocationData | null = city_name ? {
            city_name: city_name.trim(),
            ...(state_code && { state_code: state_code.trim() }),
            ...(country_code && { country_code: country_code.trim() })
        } : null;

        switch (subCommand) {
            case WeatherSubCommandName.LOCATION:
            case WeatherSubCommandName.USER: {
                return interaction.followUp(await this.fetchCurrentResponse(interaction, location ?? member))
            }
            case WeatherSubCommandName.SERVER_TEMPS: { return interaction.followUp(await this.fetchServerTempsResponse(interaction, { page: 1 })) }
            case WeatherSubCommandName.LINK: { return interaction.followUp(await this.fetchLinkResponse(interaction, location!, member)) }
            case WeatherSubCommandName.UNLINK: { return interaction.followUp(await this.fetchUnlinkResponse(interaction, member)) }
            default: { throw interaction }
        }
    }

    public override async onButton(interaction: ButtonInteraction, customData: WeatherButtonCustomData): Promise<any> {
        await interaction.deferUpdate();
        const { message } = <{ message: Message }>interaction;

        const location: LocationData | null = (customData.name) ? {
            city_name: customData.name,
            ...(customData.state && { state_code: customData.state }),
            ...(customData.country && { country_code: customData.country }),
        } : null;

        switch (customData.display) {
            case WeatherDisplayType.WARNING: { return message.edit(await this.fetchWarningResponse(interaction, location)) }
            case WeatherDisplayType.CURRENT: { return message.edit(await this.fetchCurrentResponse(interaction, location)) }
            case WeatherDisplayType.FORECAST: { return message.edit(await this.fetchForecastResponse(interaction, location)) }
            case WeatherDisplayType.AIR_QUALITY: { return message.edit(await this.fetchAirQualityResponse(interaction, location)) }
            case WeatherDisplayType.SERVER_TEMPS: { return message.edit(await this.fetchServerTempsResponse(interaction, { page: customData.page! })) }
            default: { throw interaction }
        }
    }

    public override async onSelectMenu(interaction: SelectMenuInteraction, _customData: HandlerCustomData): Promise<any> {
        await interaction.deferUpdate();
        const order = <WeatherTempsOrder>interaction.values[0];
        const message = <Message>interaction.message;
        WeatherEmbedFactory.orderEmbedData((message.embeds[0]!), order);
        const selectMenu = <WeatherSelectMenuFactory>message.components[0]!.components[0];
        selectMenu.options.forEach(option => option.default = option.value === order)
        return await message.edit({
            ...(message.content && { content: message.content }),
            components: message.components,
            embeds: message.embeds,
        });
    }

    private async fetchWarningResponse(context: HandlerContext, scope: GuildMember | LocationData | null): Promise<InteractionReplyOptions> {
        const member = scope instanceof GuildMember ? scope : <GuildMember>context.member;
        const location = scope instanceof GuildMember ? null : scope;
        const link = await this.database.fetchLink(member);
        if (!location && !link) return WeatherEmbedFactory.getMissingParamsEmbed(context, member).toReplyOptions();
        const geocoding = location ? await this.api.geocoding(location) : [link!];
        if (OpenWeatherAPI.isError(geocoding)) return WeatherEmbedFactory.getAPIErrorEmbed(context, geocoding).toReplyOptions();
        if (!geocoding.length) return WeatherEmbedFactory.getUnknownLocationEmbed(context, location!).toReplyOptions();
        const onecall = await this.api.oneCall(geocoding[0]!);
        if (OpenWeatherAPI.isError(onecall)) return WeatherEmbedFactory.getAPIErrorEmbed(context, onecall).toReplyOptions();
        const embed = WeatherEmbedFactory.getAlertEmbed(context, geocoding[0]!, onecall);
        const actionRow: MessageActionRow = new MessageActionRow().addComponents([
            WeatherButtonFactory.getWeatherButton(this, WeatherDisplayType.CURRENT, geocoding[0]!),
            WeatherButtonFactory.getWeatherButton(this, WeatherDisplayType.FORECAST, geocoding[0]!),
            WeatherButtonFactory.getWeatherButton(this, WeatherDisplayType.AIR_QUALITY, geocoding[0]!),
            WeatherButtonFactory.getViewMapButton(this, geocoding[0]!)
        ]);
        return { embeds: [embed], components: [actionRow] }
    }

    private async fetchCurrentResponse(context: HandlerContext, scope: GuildMember | LocationData | null): Promise<InteractionReplyOptions> {
        const member = scope instanceof GuildMember ? scope : <GuildMember>context.member;
        const location = scope instanceof GuildMember ? null : scope;
        const link = await this.database.fetchLink(member);
        if (!location && !link) return WeatherEmbedFactory.getMissingParamsEmbed(context, member).toReplyOptions();
        const geocoding = location ? await this.api.geocoding(location) : [link!];
        if (OpenWeatherAPI.isError(geocoding)) return WeatherEmbedFactory.getAPIErrorEmbed(context, geocoding).toReplyOptions();
        if (!geocoding.length) return WeatherEmbedFactory.getUnknownLocationEmbed(context, location!).toReplyOptions();
        const onecall = await this.api.oneCall(geocoding[0]!);
        if (OpenWeatherAPI.isError(onecall)) return WeatherEmbedFactory.getAPIErrorEmbed(context, onecall).toReplyOptions();
        const embed = WeatherEmbedFactory.getCurrentEmbed(context, geocoding[0]!, onecall);
        const actionRow: MessageActionRow = new MessageActionRow().addComponents([
            WeatherButtonFactory.getWeatherButton(this, WeatherDisplayType.FORECAST, geocoding[0]!),
            WeatherButtonFactory.getWeatherButton(this, WeatherDisplayType.AIR_QUALITY, geocoding[0]!),
            ...(onecall.alerts && onecall.alerts.length ? [WeatherButtonFactory.getWeatherButton(this, WeatherDisplayType.WARNING, geocoding[0]!)] : []),
            WeatherButtonFactory.getViewMapButton(this, geocoding[0]!)
        ]);
        return { embeds: [embed], components: [actionRow] }
    }

    private async fetchForecastResponse(context: HandlerContext, scope: GuildMember | LocationData | null): Promise<InteractionReplyOptions> {
        const member = scope instanceof GuildMember ? scope : <GuildMember>context.member;
        const location = scope instanceof GuildMember ? null : scope;
        const link = await this.database.fetchLink(member);
        if (!location && !link) return WeatherEmbedFactory.getMissingParamsEmbed(context, member).toReplyOptions();
        const geocoding = location ? await this.api.geocoding(location) : [link!];
        if (OpenWeatherAPI.isError(geocoding)) return WeatherEmbedFactory.getAPIErrorEmbed(context, geocoding).toReplyOptions();
        if (!geocoding.length) return WeatherEmbedFactory.getUnknownLocationEmbed(context, location!).toReplyOptions();
        const onecall = await this.api.oneCall(geocoding[0]!);
        if (OpenWeatherAPI.isError(onecall)) return WeatherEmbedFactory.getAPIErrorEmbed(context, onecall).toReplyOptions();
        const embed = WeatherEmbedFactory.getForecastEmbed(context, geocoding[0]!, onecall);
        const actionRow: MessageActionRow = new MessageActionRow().addComponents([
            WeatherButtonFactory.getWeatherButton(this, WeatherDisplayType.CURRENT, geocoding[0]!),
            WeatherButtonFactory.getWeatherButton(this, WeatherDisplayType.AIR_QUALITY, geocoding[0]!),
            ...(onecall.alerts && onecall.alerts.length ? [WeatherButtonFactory.getWeatherButton(this, WeatherDisplayType.WARNING, geocoding[0]!)] : []),
            WeatherButtonFactory.getViewMapButton(this, geocoding[0]!)
        ]);
        return { embeds: [embed], components: [actionRow] }
    }

    private async fetchAirQualityResponse(context: HandlerContext, scope: GuildMember | LocationData | null): Promise<InteractionReplyOptions> {
        const member = scope instanceof GuildMember ? scope : <GuildMember>context.member;
        const location = scope instanceof GuildMember ? null : scope;
        const link = await this.database.fetchLink(member);
        if (!location && !link) return WeatherEmbedFactory.getMissingParamsEmbed(context, member).toReplyOptions();
        const geocoding = location ? await this.api.geocoding(location) : [link!];
        if (OpenWeatherAPI.isError(geocoding)) return WeatherEmbedFactory.getAPIErrorEmbed(context, geocoding).toReplyOptions();
        if (!geocoding.length) return WeatherEmbedFactory.getUnknownLocationEmbed(context, location!).toReplyOptions();
        const airPollution = await this.api.airPollution(geocoding[0]!);
        if (OpenWeatherAPI.isError(airPollution)) return WeatherEmbedFactory.getAPIErrorEmbed(context, airPollution).toReplyOptions();
        const embed = WeatherEmbedFactory.getAirPollutionEmbed(context, geocoding[0]!, airPollution);
        const actionRow: MessageActionRow = new MessageActionRow().addComponents([
            WeatherButtonFactory.getWeatherButton(this, WeatherDisplayType.CURRENT, geocoding[0]!),
            WeatherButtonFactory.getWeatherButton(this, WeatherDisplayType.FORECAST, geocoding[0]!),
            WeatherButtonFactory.getViewMapButton(this, geocoding[0]!)
        ]);
        return { embeds: [embed], components: [actionRow] }
    }

    private async fetchServerTempsResponse(context: HandlerContext, viewData: { page: number, perPage?: number, order?: WeatherTempsOrder }): Promise<InteractionReplyOptions> {
        const page = viewData.page;
        const perPage = viewData.perPage ?? 20;
        const order = viewData.order ?? WeatherTempsOrder.HOTTEST;
        const { channel, guild } = <{ channel: GuildChannel, guild: Guild }>context;
        const links = (await this.database.fetchAllLinks(guild)).reduce((array, link) => {
            const member = (<TextChannel>channel).members.get(<any>link.user_id.toString());
            if (member) array.push([link, member])
            return array;
        }, new Array());
        if (!links.length) return WeatherEmbedFactory.getNoLinkedMembersEmbed(context, channel).toReplyOptions();
        const sliced = links.slice((page - 1) * perPage, page * perPage);
        if (!sliced.length && page !== 1) return this.fetchServerTempsResponse(context, { page: 1 });
        for (const slice of sliced) slice.push(await this.api.oneCall(slice[0]));
        const embed = WeatherEmbedFactory.orderEmbedData(WeatherEmbedFactory.getServerTempsEmbed(context, sliced), order);
        const orderActionRow = new MessageActionRow().addComponents([WeatherSelectMenuFactory.getOrderSelectMenu(this, order)]);
        const pageActionRow = new MessageActionRow();
        if ((page - 1 > 0) && (links.length / perPage) >= page - 1) pageActionRow.addComponents(WeatherButtonFactory.getWeatherButton(this, WeatherDisplayType.SERVER_TEMPS, page - 1));
        if ((page + 1 > 0) && (links.length / perPage) >= page + 1) pageActionRow.addComponents(WeatherButtonFactory.getWeatherButton(this, WeatherDisplayType.SERVER_TEMPS, page + 1));
        const components = pageActionRow.components.length ? [orderActionRow, pageActionRow] : [orderActionRow];
        return { embeds: [embed], components: components };
    }

    private async fetchLinkResponse(context: HandlerContext, location: LocationData, targetMember: GuildMember) {
        const { member } = <{ member: GuildMember }>context;
        if (targetMember !== member && !this.isAdmin(context)) return WeatherEmbedFactory.getMissingAdminEmbed(context).toReplyOptions();
        const geocoding = await this.api.geocoding(location);
        if (OpenWeatherAPI.isError(geocoding)) return WeatherEmbedFactory.getAPIErrorEmbed(context, geocoding).toReplyOptions();
        if (!geocoding.length) return WeatherEmbedFactory.getUnknownLocationEmbed(context, location).toReplyOptions();
        await this.database.setLink(targetMember, geocoding[0]!);
        const geoLocation: LocationData = {
            city_name: geocoding[0]!.name,
            ...(geocoding[0]!.state && { state_code: geocoding[0]!.state }),
            ...(geocoding[0]!.country && { country_code: geocoding[0]!.country }),
        };
        const embed = WeatherEmbedFactory.getLinkedEmbed(context, geoLocation, targetMember);
        const actionRow = new MessageActionRow().addComponents([
            WeatherButtonFactory.getWeatherButton(this, WeatherDisplayType.CURRENT, geocoding[0]!),
            WeatherButtonFactory.getWeatherButton(this, WeatherDisplayType.FORECAST, geocoding[0]!),
            WeatherButtonFactory.getWeatherButton(this, WeatherDisplayType.AIR_QUALITY, geocoding[0]!),
            WeatherButtonFactory.getViewMapButton(this, geocoding[0]!)
        ]);
        return { embed: embed, embeds: [embed], components: [actionRow] };
    }

    private async fetchUnlinkResponse(context: HandlerContext, targetMember: GuildMember): Promise<InteractionReplyOptions> {
        const { member } = <{ member: GuildMember }>context;
        if (targetMember !== member && !this.isAdmin(context)) return WeatherEmbedFactory.getMissingAdminEmbed(context).toReplyOptions();
        await this.database.deleteLink(targetMember);
        const embed = WeatherEmbedFactory.getUnlinkedEmbed(context, member)
        return { embeds: [embed], components: [] }
    }

    public override async setup(_client: CommandClient): Promise<HandlerResult> {
        return this.database.setup().then(() => ({ message: 'Setup Database' }));
    }
}
