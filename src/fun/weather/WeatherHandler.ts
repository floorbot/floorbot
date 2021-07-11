import { ButtonInteraction, GuildMember, CommandInteraction, Permissions, User, ApplicationCommandData, TextChannel, Message, CommandInteractionOption, MessageEmbed } from 'discord.js';
import { BaseHandler, CommandHandler, ButtonHandler, CommandClient, ComponentCustomData, HandlerContext } from 'discord.js-commands';
import { WeatherCommandData, WeatherSubCommandNames } from './WeatherCommandData'
import { WeatherDatabase, WeatherDatabaseRow } from './database/WeatherDatabase';
import { InteractionReplyOptions, MessageActionRow } from 'discord.js';
import { OpenWeatherAPI, LocationData } from './api/OpenWeatherAPI';
import * as MariaDB from 'mariadb';
import { Pool } from 'mariadb';

// Custom Embeds
import { TempsEmbed, TempsEmbedOrder } from './message/embeds/TempsEmbed';
import { AirPollutionEmbed } from './message/embeds/AirPollutionEmbed';
import { ForecastEmbed } from './message/embeds/ForecastEmbed';
import { CurrentEmbed } from './message/embeds/CurrentEmbed';
import { WeatherEmbed } from './message/WeatherEmbed';

import { NoLinkedAccountEmbed } from './message/embeds/NoLinkedAccountEmbed';
import { UnknownLocationEmbed } from './message/embeds/UnknownLocationEmbed';
import { MissingParamsEmbed } from './message/embeds/MissingParamsEmbed';
import { MissingAdminEmbed } from './message/embeds/MissingAdminEmbed';

// Custom Buttons
import { AirQualityButton } from './message/buttons/AirQualityButton';
import { TempsPageButton } from './message/buttons/TempsPageButton';
import { TempsSortButton } from './message/buttons/TempsSortButton';
import { ForecastButton } from './message/buttons/ForecastButton';
import { CurrentButton } from './message/buttons/CurrentButton';
import { ViewMapButton } from './message/buttons/ViewMapButton';

import { CurrentData, ForecastData, GeocodeData, AirPollutionData } from './api/OpenWeatherAPI';

export { WeatherSubCommandNames };

export interface WeatherButtonCustomData extends ComponentCustomData {
    readonly fn: string,
    readonly page?: number,
    readonly cn?: string,
    readonly sc?: string,
    readonly cc?: string,
    readonly wl?: string,
    readonly sort?: TempsEmbedOrder
}

import * as nconf from 'nconf';
nconf.required(['WEATHER:DB_HOST', 'WEATHER:DB_NAME', 'WEATHER:DB_USERNAME', 'WEATHER:DB_PASSWORD', 'WEATHER:DB_CONNECTION_LIMIT']);

export class WeatherHandler extends BaseHandler implements CommandHandler, ButtonHandler {

    public readonly commandData: ApplicationCommandData;
    public readonly isGlobal: boolean;
    public readonly pool: Pool;

    constructor(client: CommandClient) {
        super(client, {
            id: 'weather',
            name: 'Weather',
            group: 'Fun',
            nsfw: false,
        });
        this.commandData = WeatherCommandData;
        this.isGlobal = false;

        this.pool = MariaDB.createPool({
            host: nconf.get('WEATHER:DB_HOST'),
            database: nconf.get('WEATHER:DB_NAME'),
            user: nconf.get('WEATHER:DB_USERNAME'),
            password: nconf.get('WEATHER:DB_PASSWORD'),
            connectionLimit: nconf.get('WEATHER:DB_CONNECTION_LIMIT'),
            supportBigInt: true
        });
    }

    public async onButton(interaction: ButtonInteraction, customData: any): Promise<any> {
        const { message } = <{ message: Message }>interaction;
        await interaction.deferUpdate();
        if (customData.wl && customData.wl !== interaction.user.id) {
            const embed = new WeatherEmbed(interaction)
                .setDescription('Sorry! Only the author of the command can update this message')
            return interaction.reply({ embeds: [embed], ephemeral: true })
        }
        const location: LocationData | null = (customData.cn) ? {
            city_name: customData.cn,
            state_code: customData.sc || null,
            country_code: customData.cc || null
        } : null;
        switch (customData.fn) {
            case 'c': { return message.edit(await this.fetchCurrentResponse(interaction, location)) }
            case 'f': { return message.edit(await this.fetchForecastResponse(interaction, location)) }
            case 'a': { return message.edit(await this.fetchAirQualityResponse(interaction, location)) }
            case 't': { return message.edit(await this.fetchTempsResponse(interaction, customData)) }
            default: { throw interaction }
        }
    }

    public async onCommand(interaction: CommandInteraction): Promise<any> {
        await interaction.defer();
        const subCommand: CommandInteractionOption = interaction.options.first()!;
        const user: User = (subCommand.options && subCommand.options.has('user')) ? subCommand.options.get('user')!.user! : interaction.user;
        const linked: WeatherDatabaseRow | null = await WeatherDatabase.fetchLinked(this.pool, interaction.user, interaction.guild!);
        const location: LocationData | null = (subCommand.options && subCommand.options.has('city_name')) ? {
            city_name: subCommand.options.get('city_name')!.value!.toString(),
            state_code: subCommand.options.has('state_code') ? subCommand.options.get('state_code')!.value!.toString() : null,
            country_code: subCommand.options.has('country_code') ? subCommand.options.get('country_code')!.value!.toString() : null
        } : linked;
        switch (subCommand.name) {
            case WeatherSubCommandNames.CURRENT: { return interaction.followUp(await this.fetchCurrentResponse(interaction, location)) }
            case WeatherSubCommandNames.FORECAST: { return interaction.followUp(await this.fetchForecastResponse(interaction, location)) }
            case WeatherSubCommandNames.AIR_QUALITY: { return interaction.followUp(await this.fetchAirQualityResponse(interaction, location)) }
            case WeatherSubCommandNames.TEMPS: { return interaction.followUp(await this.fetchTempsResponse(interaction, { page: 1 })) }
            case WeatherSubCommandNames.LINK: { return interaction.followUp(await this.fetchLinkResponse(interaction, location, user)) }
            case WeatherSubCommandNames.UNLINK: { return interaction.followUp(await this.fetchUnlinkResponse(interaction, user)) }
            default: { throw interaction }
        }
    }

    private async fetchCurrentResponse(context: HandlerContext, location: LocationData | null): Promise<InteractionReplyOptions> {
        if (!location) return new MissingParamsEmbed(context).toReplyOptions();
        const current: CurrentData = await OpenWeatherAPI.current(location);
        if (current.cod !== 200) return new UnknownLocationEmbed(context, location).toReplyOptions();
        const embed: MessageEmbed = new CurrentEmbed(context, current);
        const actionRow: MessageActionRow = new MessageActionRow().addComponents([
            new ForecastButton(location),
            new AirQualityButton(location),
            new ViewMapButton(current.coord)
        ]);
        return { embeds: [embed], components: [actionRow] }
    }

    private async fetchForecastResponse(context: HandlerContext, location: LocationData | null): Promise<InteractionReplyOptions> {
        if (!location) return new MissingParamsEmbed(context).toReplyOptions();
        const forecast: ForecastData = await OpenWeatherAPI.forecast(location);
        if (forecast.cod !== '200') return new UnknownLocationEmbed(context, location).toReplyOptions();
        const embed: MessageEmbed = await ForecastEmbed.generateEmbed(context, forecast)
        const actionRow: MessageActionRow = new MessageActionRow().addComponents([
            new CurrentButton(location),
            new AirQualityButton(location),
            new ViewMapButton(forecast.city.coord)
        ]);
        return { embeds: [embed], components: [actionRow] }
    }

    private async fetchAirQualityResponse(context: HandlerContext, location: LocationData | null): Promise<InteractionReplyOptions> {
        if (!location) return new MissingParamsEmbed(context).toReplyOptions();
        const geocoding: Array<GeocodeData> = await OpenWeatherAPI.geocoding(location);
        if (!geocoding.length) return new UnknownLocationEmbed(context, location).toReplyOptions();
        const airPollution: AirPollutionData = await OpenWeatherAPI.airPollution(geocoding[0]);
        if (!airPollution.list.length) return new UnknownLocationEmbed(context, location).toReplyOptions();
        const embed: MessageEmbed = new AirPollutionEmbed(context, geocoding[0], airPollution);
        const actionRow: MessageActionRow = new MessageActionRow().addComponents([
            new CurrentButton(location),
            new ForecastButton(location),
            new ViewMapButton(geocoding[0])
        ]);
        return { embeds: [embed], components: [actionRow] }
    }

    private async fetchTempsResponse(context: HandlerContext, customData: any): Promise<InteractionReplyOptions> {
        if (customData.sort) {
            const message = <Message>(<ButtonInteraction>context).message;
            console.log(customData.sort)
            const embed = TempsEmbed.orderEmbedData(<MessageEmbed>(message.embeds[0]), customData.sort);
            const actionRow = message.components[0];
            actionRow.components[0] = new TempsSortButton(customData.sort === TempsEmbedOrder.HOTTEST ? TempsEmbedOrder.HUMIDITY : TempsEmbedOrder.HOTTEST);
            return { embeds: [embed], components: [actionRow] }
        }

        const perPage = customData.perPage ?? 20;
        const page = customData.page || 1;
        const { channel, guild } = context;
        const linkedAccounts = (await WeatherDatabase.fetchAllLinked(this.pool, guild!)).reduce((map, link) => {
            const member = (<TextChannel>channel).members.get(<any>link.user_id.toString());
            if (member) map.set(link, member);
            return map;
        }, new Map<WeatherDatabaseRow, GuildMember>());
        if (!linkedAccounts.size) return new NoLinkedAccountEmbed(context).toReplyOptions();
        const sliced = Array.from(linkedAccounts).slice((page - 1) * perPage, page * perPage);
        return Promise.all(sliced.map(async ([link, member]) => {
            return { link: link, member: member, current: await OpenWeatherAPI.current(link) }
        })).then(async (data) => {
            if (!data.length && page !== 1) return this.fetchTempsResponse(context, { page: 1, perPage });
            const embed = await TempsEmbed.generateEmbed(context, data);
            const actionRow = new MessageActionRow();
            actionRow.addComponents(new TempsSortButton(TempsEmbedOrder.HUMIDITY));
            if ((page - 1 > 0) && (linkedAccounts.size / perPage) >= page - 1) actionRow.addComponents(new TempsPageButton(page, page - 1));
            if ((page + 1 > 0) && (linkedAccounts.size / perPage) >= page + 1) actionRow.addComponents(new TempsPageButton(page, page + 1));
            return { embeds: [embed], components: [actionRow] }
        })
    }

    private async fetchLinkResponse(context: HandlerContext, location: LocationData | null, targetUser: User) {
        if (!location) return new MissingParamsEmbed(context).toReplyOptions();
        const user = context instanceof Message ? context.author : context.user;
        const { guild, member } = context;
        if (targetUser !== user && ((member && !(<Permissions>member.permissions).has('ADMINISTRATOR')) || !member)) return new MissingAdminEmbed(context).toReplyOptions();
        const geocoding = await OpenWeatherAPI.geocoding(location);
        if (!geocoding.length) return new UnknownLocationEmbed(context, location).toReplyOptions();
        const loc = { city_name: geocoding[0].name, state_code: geocoding[0].state, country_code: geocoding[0].country }
        await WeatherDatabase.setLinked(this.pool, { ...geocoding[0], ...loc, user_id: targetUser.id, guild_id: guild!.id });
        const locationString = OpenWeatherAPI.getLocationString(loc);
        const embed = new WeatherEmbed(context)
            .setDescription(`Succesfully linked location \`${locationString}\` to ${targetUser} 🥳`);
        const actionRow = new MessageActionRow().addComponents([
            new CurrentButton(location, user),
            new ForecastButton(location, user),
            new AirQualityButton(location, user),
            new ViewMapButton(geocoding[0])
        ]);
        return { embed: embed, embeds: [embed], components: [actionRow] };
    }

    private async fetchUnlinkResponse(context: HandlerContext, targetUser: User): Promise<InteractionReplyOptions> {
        const user = context instanceof Message ? context.author : context.user;
        const { member, guild } = context;
        if (targetUser !== user && ((member && !(<Permissions>member.permissions).has('ADMINISTRATOR')) || !member)) return new MissingAdminEmbed(context).toReplyOptions();
        return WeatherDatabase.clearLinked(this.pool, targetUser, guild!).then(() => {
            const embed = new WeatherEmbed(context)
                .setDescription(`Succesfully unlinked any saved location from ${targetUser} 🤠`);
            return { embeds: [embed], components: [] }
        })
    }

    public async setup() { return WeatherDatabase.createTable(this.pool); }
}
