import { WeatherSlashCommandStringOptionName } from './builders/commands/options/WeatherSlashCommandStringOption.js';
import { WeatherSlashCommandUserOptionName } from './builders/commands/options/WeatherSlashCommandUserOption.js';
import { ChatInputCommandInteraction, GuildMember, MessageComponentInteraction } from 'discord.js';
import { WeatherSelectMenuOptionValue } from './builders/components/WeatherSelectMenuOption.js';
import { WeatherSubcommandName } from './builders/commands/WeatherSlashCommandSubcommand.js';
import { LocationQuery, OpenWeatherAPI } from '../../apis/open_weather/OpenWeatherAPI.js';
import { AirPollutionData } from '../../apis/open_weather/interfaces/AirPollutionData.js';
import { OpenWeatherAPILimiter } from '../../apis/open_weather/OpenWeatherAPILimiter.js';
import { WeatherAPIError } from '../../apis/open_weather/interfaces/WeatherAPIError.js';
import { PageableButtonId } from '../../helpers/builders/pageable/PageableButton.js';
import { WeatherSelectMenuId } from './builders/components/WeatherSelectMenu.js';
import { WeatherSlashCommand } from './builders/commands/WeatherSlashCommand.js';
import WeatherLinkRow, { WeatherLinkTable } from './tables/WeatherLinkTable.js';
import { GeocodeData } from '../../apis/open_weather/interfaces/GeocodeData.js';
import { OneCallData } from '../../apis/open_weather/interfaces/OneCallData.js';
import { WeatherButtonId } from './builders/components/WeatherButton.js';
import { WeatherEmojiTable } from './tables/WeatherEmojiTable.js';
import { FloorbotReply } from '../../helpers/FloorbotReply.js';
import { ChatInputCommandHandler } from 'discord.js-handlers';
import { WeatherReply } from './builders/WeatherReply.js';
import { Pageable } from '../../../lib/Pageable.js';
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
            case WeatherSubcommandName.All: {
                if (!command.inGuild() || !command.guild) return command.reply(FloorbotReply.guildOnly());
                await command.deferReply();
                const { guild } = command;
                const links: [OneCallData, GuildMember, WeatherLinkRow][] = new Array();
                const allLinks = await this.linkTable.selectLinks(guild);
                const loadingReply = WeatherReply.loading(allLinks.length, 0);
                let lastUpdate = (await command.followUp(loadingReply)).createdTimestamp;
                for (const [i, link] of allLinks.entries()) {
                    const member = await guild.members.fetch(link.user_id);
                    if (member) {
                        const onecall = await this.openweather.oneCall(link);
                        if (this.openweather.isError(onecall)) continue;
                        links.push([onecall, member, link]);
                    }
                    if (Date.now() - lastUpdate >= 1000) {
                        const loadingReply = WeatherReply.loading(allLinks.length, i + 1);
                        lastUpdate = (await command.editReply(loadingReply)).createdTimestamp;
                    }
                }
                if (!Pageable.isNonEmptyArray(links)) return command.followUp(WeatherReply.missingLinkedMembers());
                const pageable = new Pageable(links, { perPage: 40 });
                let order = WeatherSelectMenuOptionValue.Hottest;
                const replyOptions = WeatherReply.allTemps(pageable, this.emojiTable, order);
                const message = await command.followUp(replyOptions);
                const collector = Util.createComponentCollector(command.client, message);
                collector.on('collect', async component => {
                    await component.deferUpdate();
                    if (component.isButton() && component.customId === PageableButtonId.NextPage) { pageable.page++; }
                    if (component.isButton() && component.customId === PageableButtonId.PreviousPage) { pageable.page--; }
                    if (component.isSelectMenu() && component.customId === WeatherSelectMenuId.Order) { order = component.values[0] as WeatherSelectMenuOptionValue; }
                    const replyOptions = WeatherReply.allTemps(pageable, this.emojiTable, order);
                    await component.editReply(replyOptions);
                });
                break;
            }
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

    private async fetchWeather(location: LocationQuery): Promise<WeatherAPIError | { geocode: GeocodeData; onecall: OneCallData; airQuality: AirPollutionData; } | null> {
        const geocoding = await this.openweather.geocoding(location);
        if (this.openweather.isError(geocoding)) return geocoding;
        if (!geocoding[0]) return null;
        const onecall = await this.openweather.oneCall(geocoding[0]);
        if (this.openweather.isError(onecall)) return onecall;
        const airQuality = await this.openweather.airPollution(geocoding[0]);
        if (this.openweather.isError(airQuality)) return airQuality;
        return { geocode: geocoding[0], onecall, airQuality };
    }

    private createCollectorFunction(weather: { geocode: GeocodeData; onecall: OneCallData; airQuality: AirPollutionData; }): (component: MessageComponentInteraction) => void {
        return async (component: MessageComponentInteraction) => {
            switch (component.customId) {
                case WeatherButtonId.Current: return component.update(WeatherReply.current(weather));
                case WeatherButtonId.Forecast: return component.update(WeatherReply.forecast({ ...weather, emojiTable: this.emojiTable }));
                case WeatherButtonId.AirQuality: return component.update(WeatherReply.airQuality({ ...weather, emojiTable: this.emojiTable }));
                case WeatherButtonId.Alert: return component.update(WeatherReply.alert(weather));
                default: throw component;
            }
        };
    }
}
