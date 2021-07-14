import { ButtonInteraction, GuildMember, CommandInteraction, ApplicationCommandData, TextChannel, Message, CommandInteractionOption, Guild, GuildChannel } from 'discord.js';
import { BaseHandler, CommandHandler, ButtonHandler, CommandClient, ComponentCustomData, HandlerContext, BaseHandlerOptions } from 'discord.js-commands';
import { WeatherCommandData, WeatherSubCommandName } from './WeatherCommandData'
import { InteractionReplyOptions, MessageActionRow } from 'discord.js';
import { OpenWeatherAPI, LocationData } from './api/OpenWeatherAPI';
import { WeatherDatabase } from './WeatherDatabase';
import { Pool } from 'mariadb';

// Custom Embeds
import { ServerTempsEmbed, ServerTempsEmbedOrder } from './message/embeds/ServerTempsEmbed';
import { AirPollutionEmbed } from './message/embeds/AirPollutionEmbed';
import { ForecastEmbed } from './message/embeds/ForecastEmbed';
import { CurrentEmbed } from './message/embeds/CurrentEmbed';
import { WeatherEmbed } from './message/embeds/WeatherEmbed';

// Custom Buttons
import { WeatherButton, DisplayType } from './message/buttons/WeatherButton';
import { ViewMapButton } from './message/buttons/ViewMapButton';


export interface WeatherButtonCustomData extends ComponentCustomData {
    readonly fn: string,
    readonly page?: number,
    readonly cn?: string,
    readonly sc?: string,
    readonly cc?: string,
    readonly wl?: string,
    readonly sort?: ServerTempsEmbedOrder
}

import * as nconf from 'nconf';
nconf.required(['OPEN_WEATHER_API_KEY']);

export interface WeatherHandlerOptions extends BaseHandlerOptions {
    pool: Pool
}

export class WeatherHandler extends BaseHandler implements CommandHandler, ButtonHandler {

    public readonly commandData: ApplicationCommandData;
    public readonly database: WeatherDatabase;
    public readonly api: OpenWeatherAPI;
    public readonly isGlobal: boolean;

    constructor(client: CommandClient, options: WeatherHandlerOptions) {
        super(client, {
            id: 'weather',
            name: 'Weather',
            group: 'Fun',
            nsfw: false,
        });
        this.database = new WeatherDatabase(options.pool);
        this.commandData = WeatherCommandData;
        this.isGlobal = false;
        this.api = new OpenWeatherAPI(nconf.get('OPEN_WEATHER_API_KEY'));
    }

    public async onButton(interaction: ButtonInteraction, customData: any): Promise<any> {
        await interaction.deferUpdate();

        const { message } = <{ message: Message }>interaction;
        const data = WeatherButton.decodeCustomData(customData);
        const location: LocationData | null = (data.name) ? {
            city_name: data.name,
            ...(data.state && { state_code: data.state }),
            ...(data.country && { country_code: data.country }),
        } : null;

        switch (data.display) {
            case DisplayType.CURRENT: { return message.edit(await this.fetchCurrentResponse(interaction, location)) }
            case DisplayType.FORECAST: { return message.edit(await this.fetchForecastResponse(interaction, location)) }
            case DisplayType.AIR_QUALITY: { return message.edit(await this.fetchAirQualityResponse(interaction, location)) }
            case DisplayType.SERVER_TEMPS: { return message.edit(await this.fetchServerTempsResponse(interaction, data.page!)) }
            default: { throw interaction }
        }
    }

    public async onCommand(interaction: CommandInteraction): Promise<any> {
        await interaction.defer();

        const subCommand: CommandInteractionOption = interaction.options.first()!;
        const member: GuildMember = <GuildMember>((subCommand.options && subCommand.options.has('user')) ? subCommand.options.get('user')!.member! : interaction.member);
        const location: LocationData | null = (subCommand.options && subCommand.options.has('city_name')) ? {
            city_name: subCommand.options.get('city_name')!.value!.toString(),
            ...(subCommand.options.has('state_code') && { state_code: subCommand.options.get('state_code')!.value!.toString() }),
            ...(subCommand.options.has('country_code') && { country_code: subCommand.options.get('country_code')!.value!.toString() })
        } : null;

        switch (subCommand.name) {
            case WeatherSubCommandName.LOCATION:
            case WeatherSubCommandName.USER: {
                return interaction.followUp(await this.fetchAirQualityResponse(interaction, location ?? member))
            }
            case WeatherSubCommandName.SERVER_TEMPS: { return interaction.followUp(await this.fetchServerTempsResponse(interaction, 1)) }
            case WeatherSubCommandName.LINK: { return interaction.followUp(await this.fetchLinkResponse(interaction, location!, member)) }
            case WeatherSubCommandName.UNLINK: { return interaction.followUp(await this.fetchUnlinkResponse(interaction, member)) }
            default: { throw interaction }
        }
    }

    private async fetchCurrentResponse(context: HandlerContext, scope: GuildMember | LocationData | null): Promise<InteractionReplyOptions> {
        const member = scope instanceof GuildMember ? scope : <GuildMember>context.member;
        const location = scope instanceof GuildMember ? null : scope;
        const link = await this.database.fetchLink(member);
        if (!location && !link) return WeatherEmbed.getMissingParamsEmbed(context, member).toReplyOptions();
        const geocoding = location ? await this.api.geocoding(location) : [link!];
        if (OpenWeatherAPI.isError(geocoding)) return WeatherEmbed.getAPIErrorEmbed(context, geocoding).toReplyOptions();
        if (!geocoding.length) return WeatherEmbed.getUnknownLocationEmbed(context, location!).toReplyOptions();
        const onecall = await this.api.oneCall(geocoding[0]);
        if (OpenWeatherAPI.isError(onecall)) return WeatherEmbed.getAPIErrorEmbed(context, onecall).toReplyOptions();
        const embed = new CurrentEmbed(context, geocoding[0], onecall);
        const actionRow: MessageActionRow = new MessageActionRow().addComponents([
            new WeatherButton(DisplayType.FORECAST, geocoding[0]),
            new WeatherButton(DisplayType.AIR_QUALITY, geocoding[0]),
            new ViewMapButton(geocoding[0])
        ]);
        return { embeds: [embed], components: [actionRow] }
    }

    private async fetchForecastResponse(context: HandlerContext, scope: GuildMember | LocationData | null): Promise<InteractionReplyOptions> {
        const member = scope instanceof GuildMember ? scope : <GuildMember>context.member;
        const location = scope instanceof GuildMember ? null : scope;
        const link = await this.database.fetchLink(member);
        if (!location && !link) return WeatherEmbed.getMissingParamsEmbed(context, member).toReplyOptions();
        const geocoding = location ? await this.api.geocoding(location) : [link!];
        if (OpenWeatherAPI.isError(geocoding)) return WeatherEmbed.getAPIErrorEmbed(context, geocoding).toReplyOptions();
        if (!geocoding.length) return WeatherEmbed.getUnknownLocationEmbed(context, location!).toReplyOptions();
        const onecall = await this.api.oneCall(geocoding[0]);
        if (OpenWeatherAPI.isError(onecall)) return WeatherEmbed.getAPIErrorEmbed(context, onecall).toReplyOptions();
        const embed = new ForecastEmbed(context, geocoding[0], onecall);
        const actionRow: MessageActionRow = new MessageActionRow().addComponents([
            new WeatherButton(DisplayType.CURRENT, geocoding[0]),
            new WeatherButton(DisplayType.AIR_QUALITY, geocoding[0]),
            new ViewMapButton(geocoding[0])
        ]);
        return { embeds: [embed], components: [actionRow] }
    }

    private async fetchAirQualityResponse(context: HandlerContext, scope: GuildMember | LocationData | null): Promise<InteractionReplyOptions> {
        const member = scope instanceof GuildMember ? scope : <GuildMember>context.member;
        const location = scope instanceof GuildMember ? null : scope;
        const link = await this.database.fetchLink(member);
        if (!location && !link) return WeatherEmbed.getMissingParamsEmbed(context, member).toReplyOptions();
        const geocoding = location ? await this.api.geocoding(location) : [link!];
        if (OpenWeatherAPI.isError(geocoding)) return WeatherEmbed.getAPIErrorEmbed(context, geocoding).toReplyOptions();
        if (!geocoding.length) return WeatherEmbed.getUnknownLocationEmbed(context, location!).toReplyOptions();
        const airPollution = await this.api.airPollution(geocoding[0]);
        if (OpenWeatherAPI.isError(airPollution)) return WeatherEmbed.getAPIErrorEmbed(context, airPollution).toReplyOptions();
        const embed = new AirPollutionEmbed(context, geocoding[0], airPollution);
        const actionRow: MessageActionRow = new MessageActionRow().addComponents([
            new WeatherButton(DisplayType.FORECAST, geocoding[0]),
            new WeatherButton(DisplayType.AIR_QUALITY, geocoding[0]),
            new ViewMapButton(geocoding[0])
        ]);
        return { embeds: [embed], components: [actionRow] }
    }

    private async fetchServerTempsResponse(context: HandlerContext, page: number, perPage: number = 20): Promise<InteractionReplyOptions> {
        // if (viewData.sort) {
        //     const message = <Message>(<ButtonInteraction>context).message;
        //     console.log(customData.sort)
        //     const embed = TempsEmbed.orderEmbedData(<MessageEmbed>(message.embeds[0]), customData.sort);
        //     const actionRow = message.components[0];
        //     actionRow.components[0] = new TempsSortButton(customData.sort === TempsEmbedOrder.HOTTEST ? TempsEmbedOrder.HUMIDITY : TempsEmbedOrder.HOTTEST);
        //     return { embeds: [embed], components: [actionRow] }
        // }

        const { channel, guild } = <{ channel: GuildChannel, guild: Guild }>context;
        const links = (await this.database.fetchAllLinks(guild)).reduce((array, link) => {
            const member = (<TextChannel>channel).members.get(<any>link.user_id.toString());
            if (member) array.push([link, member])
            return array;
        }, new Array());
        if (!links.length) return WeatherEmbed.getNoLinkedMembersEmbed(context, channel).toReplyOptions();
        const sliced = links.slice((page - 1) * perPage, page * perPage);
        if (!sliced.length && page !== 1) return this.fetchServerTempsResponse(context, 1);
        for (const slice of sliced) slice.push(await this.api.oneCall(slice[0]));
        const embed = new ServerTempsEmbed(context, sliced);
        // actionRow.addComponents(new TempsSortButton(TempsEmbedOrder.HUMIDITY));
        const pageActionRow = new MessageActionRow();
        if ((page - 1 > 0) && (links.length / perPage) >= page - 1) pageActionRow.addComponents(new WeatherButton(DisplayType.SERVER_TEMPS, page - 1));
        if ((page + 1 > 0) && (links.length / perPage) >= page + 1) pageActionRow.addComponents(new WeatherButton(DisplayType.SERVER_TEMPS, page + 1));
        return { embeds: [embed], components: pageActionRow.components.length ? [pageActionRow] : [] };

    }

    private async fetchLinkResponse(context: HandlerContext, location: LocationData, targetMember: GuildMember) {
        const { member } = <{ member: GuildMember }>context;
        if (targetMember !== member && !this.isAdmin(member)) return WeatherEmbed.getMissingAdminEmbed(context).toReplyOptions();
        const geocoding = await this.api.geocoding(location);
        if (OpenWeatherAPI.isError(geocoding)) return WeatherEmbed.getAPIErrorEmbed(context, geocoding).toReplyOptions();
        if (!geocoding.length) return WeatherEmbed.getUnknownLocationEmbed(context, location).toReplyOptions();
        await this.database.setLink(targetMember, geocoding[0]);
        const embed = WeatherEmbed.getLinkedEmbed(context, location, targetMember);
        const actionRow = new MessageActionRow().addComponents([
            new WeatherButton(DisplayType.CURRENT, geocoding[0]),
            new WeatherButton(DisplayType.FORECAST, geocoding[0]),
            new WeatherButton(DisplayType.AIR_QUALITY, geocoding[0]),
            new ViewMapButton(geocoding[0])
        ]);
        return { embed: embed, embeds: [embed], components: [actionRow] };
    }

    private async fetchUnlinkResponse(context: HandlerContext, targetMember: GuildMember): Promise<InteractionReplyOptions> {
        const { member } = <{ member: GuildMember }>context;
        if (targetMember !== member && !this.isAdmin(member)) return WeatherEmbed.getMissingAdminEmbed(context).toReplyOptions();
        await this.database.deleteLink(targetMember);
        const embed = WeatherEmbed.getUnlinkedEmbed(context, member)
        return { embeds: [embed], components: [] }
    }

    public async setup() { return this.database.setup(); }
}
