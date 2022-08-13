import { WeatherSlashCommandStringOptionName } from './builders/commands/options/WeatherSlashCommandStringOption.js';
import { WeatherSlashCommandUserOptionName } from './builders/commands/options/WeatherSlashCommandUserOption.js';
import { WeatherSubcommandName } from './builders/commands/WeatherSlashCommandSubcommand.js';
import { ChatInputCommandInteraction, MessageComponentInteraction } from 'discord.js';
import { LocationQuery, OpenWeatherAPI } from './open_weather/OpenWeatherAPI.js';
import { AirPollutionData } from './open_weather/interfaces/AirPollutionData.js';
import { WeatherSlashCommand } from './builders/commands/WeatherSlashCommand.js';
import { OpenWeatherAPILimiter } from './open_weather/OpenWeatherAPILimiter.js';
import WeatherLinkRow, { WeatherLinkTable } from './tables/WeatherLinkTable.js';
import { WeatherAPIError } from './open_weather/interfaces/WeatherAPIError.js';
import { WeatherButtonId } from './builders/components/WeatherButton.js';
import { GeocodeData } from './open_weather/interfaces/GeocodeData.js';
import { OneCallData } from './open_weather/interfaces/OneCallData.js';
import { WeatherEmojiTable } from './tables/WeatherEmojiTable.js';
import { ChatInputCommandHandler } from 'discord.js-handlers';
import { WeatherReply } from './builders/WeatherReply.js';
import { Util } from '../../helpers/Util.js';
import { Redis } from 'ioredis';
import { Pool } from 'mariadb';

export class WeatherChatInputHandler extends ChatInputCommandHandler {

    private readonly emojiTable: WeatherEmojiTable;
    private readonly linkTable: WeatherLinkTable;
    private readonly openweather: OpenWeatherAPI;

    constructor({ pool, apiKey, redis }: { pool: Pool, apiKey: string, redis: Redis; }) {
        super(WeatherSlashCommand.global());
        const limiter = new OpenWeatherAPILimiter(apiKey, {}, redis);
        this.openweather = new OpenWeatherAPI({ apiKey: apiKey, limiter: limiter });
        this.emojiTable = new WeatherEmojiTable(pool);
        this.linkTable = new WeatherLinkTable(pool);
    }

    public async run(command: ChatInputCommandInteraction): Promise<any> {
        const subCommand = command.options.getSubcommand();
        const user = (command.options.getUser(WeatherSlashCommandUserOptionName.User) || command.user);

        // Checks if member has permission when link/unlinking another member
        if (command.user.id !== user.id && !Util.isAdminOrOwner(command)) {
            const replyOptions = WeatherReply.missingAdmin();
            return command.reply(replyOptions);
        }

        switch (subCommand) {
            case WeatherSubcommandName.User: {
                await command.deferReply();
                const link = await this.linkTable.selectLink(user, command.guild);
                if (!link) return command.followUp(WeatherReply.missingLink(user));
                const location = this.createLocationQuery(link);
                const weather = await this.fetchWeather(location);
                if (!weather) return command.followUp(WeatherReply.unknownLocation(location));
                if (this.openweather.isError(weather)) return command.followUp(WeatherReply.openWeatherAPIError(weather));
                const replyOptions = WeatherReply.current({ onecall: weather.onecall, geocode: weather.geocode });
                const message = await command.followUp(replyOptions);
                const collector = Util.createComponentCollector(command.client, message);
                collector.on('collect', this.createCollectorFunction(weather));
                break;
            }
            case WeatherSubcommandName.Location: {
                await command.deferReply();
                const location = this.createLocationQuery(command);
                const weather = await this.fetchWeather(location);
                if (!weather) return command.followUp(WeatherReply.unknownLocation(location));
                if (this.openweather.isError(weather)) return command.followUp(WeatherReply.openWeatherAPIError(weather));
                const replyOptions = WeatherReply.current({ onecall: weather.onecall, geocode: weather.geocode });
                const message = await command.followUp(replyOptions);
                const collector = Util.createComponentCollector(command.client, message);
                collector.on('collect', this.createCollectorFunction(weather));
                break;
            }
            case WeatherSubcommandName.Link: {
                await command.deferReply();
                const location = this.createLocationQuery(command);
                const weather = await this.fetchWeather(location);
                if (!weather) return command.followUp(WeatherReply.unknownLocation(location));
                if (this.openweather.isError(weather)) return command.followUp(WeatherReply.openWeatherAPIError(weather));
                await this.linkTable.insertLink(user, weather.geocode, command.guild);
                const replyOptions = WeatherReply.linked(user, weather.onecall, weather.geocode);
                const message = await command.followUp(replyOptions);
                const collector = Util.createComponentCollector(command.client, message);
                collector.on('collect', this.createCollectorFunction(weather));
                break;
            }
            case WeatherSubcommandName.Unlink: {
                await command.deferReply();
                await this.linkTable.deleteLink(user, command.guild);
                const replyOptions = WeatherReply.unlinked(user);
                return command.followUp(replyOptions);
            }
        }


        switch (subCommand) {
            // case WeatherSubcommandName.All: {
            //     // await command.deferReply();
            //     // const { channel, guild } = command;
            //     // const links: [OneCallData, GuildMember, WeatherLinkRow][] = new Array();
            //     // const allLinks = await this.database.selectLinks(guild);
            //     // const loadingEmbed = WeatherReply.loading(allLinks.length, 0);
            //     // let lastUpdate = (await command.followUp(loadingEmbed)).createdTimestamp;
            //     // for (const [i, link] of allLinks.entries()) {
            //     //     const member = channel.members.get(link.user_id.toString());
            //     //     if (member) {
            //     //         const onecall = await this.openweather.oneCall(link);
            //     //         if (this.openweather.isError(onecall)) continue;
            //     //         links.push([onecall, member, link]);
            //     //     }
            //     //     if (Date.now() - lastUpdate >= 1000) {
            //     //         const loadingEmbed = WeatherReply.loading(allLinks.length, i + 1);
            //     //         lastUpdate = (await command.editReply(loadingEmbed)).createdTimestamp;
            //     //     }
            //     // }
            //     // if (!links.length) return command.followUp(WeatherReply.missingLinkedMembers(channel));
            //     // const viewData = { page: 0, perPage: 40, totalPages: Math.floor(links.length / 40) + 1, order: WeatherSelectMenuOptionValue.Hottest };
            //     // const embed = new WeatherReply(command)
            //     //     // .addWeatherServerTempsEmbed(links, viewData)
            //     //     // .addComponents(new WeatherMessageActionRow().addWeatherSelectMenu(viewData.order))
            //     //     // .addWeatherPageActionRow(viewData);
            //     // const message = await command.editReply(embed);
            //     // const collector = Util.createComponentCollector(command.client, message);
            //     // collector.on('collect', async component => {
            //     //     await component.deferUpdate();
            //     //     if (component.isButton() && component.customId === PageableComponentID.NEXT_PAGE) { viewData.page++; }
            //     //     if (component.isButton() && component.customId === PageableComponentID.PREVIOUS_PAGE) { viewData.page--; }
            //     //     if (component.isSelectMenu() && component.customId === WeatherComponentID.Order) { viewData.order = component.values[0]; }
            //     //     viewData.page = viewData.page % (Math.floor(links.length / viewData.perPage) + 1);
            //     //     viewData.page = viewData.page >= 0 ? viewData.page : (Math.floor(links.length / viewData.perPage) + 1) + viewData.page;
            //     //     const embed = new WeatherReply(command)
            //     //         .addWeatherServerTempsEmbed(links, viewData)
            //     //         .addComponents(new WeatherMessageActionRow().addWeatherSelectMenu(viewData.order))
            //     //         .addWeatherPageActionRow(viewData);
            //     //     await component.editReply(embed);
            //     // });
            //     // break;
            // }
        }
    }

    private createLocationQuery(scope: ChatInputCommandInteraction | WeatherLinkRow): LocationQuery {
        if (!(scope instanceof ChatInputCommandInteraction)) return {
            city_name: scope.name,
            ...(scope.state && { state_code: scope.state }),
            ...(scope.country && { country_code: scope.country })
        };
        const city_name = scope.options.getString(WeatherSlashCommandStringOptionName.CityName, true);
        const state_code = scope.options.getString(WeatherSlashCommandStringOptionName.StateCode);
        const country_code = scope.options.getString(WeatherSlashCommandStringOptionName.CountryCode);
        return {
            city_name: city_name.trim(),
            ...(state_code && { state_code: state_code.trim() }),
            ...(country_code && { country_code: country_code.trim() })
        };
    }

    private async fetchWeather(location: LocationQuery): Promise<WeatherAPIError | { geocode: GeocodeData; onecall: OneCallData; air: AirPollutionData; } | null> {
        const geocoding = await this.openweather.geocoding(location);
        if (this.openweather.isError(geocoding)) return geocoding;
        if (!geocoding[0]) return null;
        const onecall = await this.openweather.oneCall(geocoding[0]);
        if (this.openweather.isError(onecall)) return onecall;
        const air = await this.openweather.airPollution(geocoding[0]);
        if (this.openweather.isError(air)) return air;
        return { geocode: geocoding[0], onecall, air };
    }

    private createCollectorFunction(weather: { geocode: GeocodeData; onecall: OneCallData; air: AirPollutionData; }): (component: MessageComponentInteraction) => void {
        return async (component: MessageComponentInteraction) => {
            switch (component.customId) {
                case WeatherButtonId.Current: return component.update(WeatherReply.current(weather));
                case WeatherButtonId.Forecast: return component.update(WeatherReply.forecast({ ...weather, emojis: this.emojiTable }));
                // case WeatherButtonId.AirQuality: return component.update(WeatherReply.airQuality(weather));
                case WeatherButtonId.Alert: return component.update(WeatherReply.alert(weather));
                default: throw component;
            }
        };
    }
}
