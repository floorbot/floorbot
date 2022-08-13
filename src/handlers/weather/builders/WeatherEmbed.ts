import { LocationQuery, OpenWeatherAPI } from '../open_weather/OpenWeatherAPI.js';
import { EmbedFooterOptions, GuildChannel, GuildMember, User } from 'discord.js';
import { EmbedBuilder } from '../../../lib/discord.js/builders/EmbedBuilder.js';
import { WeatherAPIError } from '../open_weather/interfaces/WeatherAPIError.js';
import { OneCallData } from '../open_weather/interfaces/OneCallData.js';
import { GeocodeData } from '../open_weather/interfaces/GeocodeData.js';
import { WeatherEmojiTable } from '../tables/WeatherEmojiTable.js';
import { Pageable } from '../../../helpers/pageable/Pageable.js';
import { Util } from '../../../helpers/Util.js';

export class WeatherEmbed extends EmbedBuilder {

    constructor(pageable?: Pageable<OneCallData>) {
        super();
        this.setFooter(pageable ?? null);
    }

    public override setFooter(options: EmbedFooterOptions | { text: string[]; } | Pageable<OneCallData> | null): this {
        const iconURL = 'https://openweathermap.org/themes/openweathermap/assets/img/logo_white_cropped.png';
        if (options instanceof Pageable) return super.setFooter({ text: `${options.currentPage}/${options.totalPages} - Powered by OpenWeatherMap`, iconURL });
        return super.setFooter(options ?? { text: `Powered by OpenWeatherMap`, iconURL });
    }

    public static loading(total: number, current: number): WeatherEmbed {
        const progressBar = new Array(11).fill('▬');
        progressBar[Math.floor(current / total * 10)] = '🟢';
        return new WeatherEmbed()
            .setTitle(`Loading Weather!`)
            .setDescription(`Progress: ${progressBar.join('')} [${Math.round(current / total * 100)}%] ${current}/${total}`);
    }

    public static linked(user: User | GuildMember, geocode: GeocodeData): WeatherEmbed {
        const location = OpenWeatherAPI.getLocationString(geocode, true);
        return new WeatherEmbed()
            .setDescription(`Successfully linked location \`${location}\` to ${user} 🥳`);
    }

    public static unlinked(user: User | GuildMember): WeatherEmbed {
        return new WeatherEmbed()
            .setDescription(`Successfully unlinked any saved location from ${user} 🤠`);
    }

    public static missingLink(user: User | GuildMember): WeatherEmbed {
        return new WeatherEmbed()
            .setDescription(`Sorry! I do not have a saved location for ${user}. Please use \`/weather link\` to set one!`);
    }

    public static missingLinkedMembers(channel: GuildChannel): WeatherEmbed {
        return new WeatherEmbed()
            .setDescription([
                `There are no members in ${channel} with saved locations`,
                'Please use \`/weather link\` to start comparing weather!'
            ].join('\n'));
    }

    public static unknownLocation(location: LocationQuery): WeatherEmbed {
        return new WeatherEmbed()
            .setDescription([
                `Sorry! I could not find \`${OpenWeatherAPI.getLocationString(location, true)}\``,
                '*Please check the spelling or try another nearby location*'
            ]);
    }

    public static missingAdmin(): WeatherEmbed {
        return new WeatherEmbed()
            .setDescription(`Sorry! you must be an admin to force link or unlink locations from other people!`);
    }

    public static openWeatherAPIError(error: WeatherAPIError): WeatherEmbed {
        return new WeatherEmbed()
            .setDescription([
                `Sorry I seem to have an API issue:`,
                `*${error.message}*`
            ]);
    }

    public static current({ onecall, geocode }: { onecall: OneCallData, geocode: GeocodeData; }): WeatherEmbed {
        const locationString: string = OpenWeatherAPI.getLocationString(geocode, true);
        const timeString = Util.formatTimezone(onecall.timezone);
        const localeEmoji = Util.localeToEmoji(geocode.country);
        return new WeatherEmbed()
            .setURL(OpenWeatherAPI.getGoogleMapsLink(onecall))
            .setTitle(`${localeEmoji} Weather for ${locationString} (${timeString})`)
            .setThumbnail(`http://openweathermap.org/img/wn/${onecall.current.weather[0].icon}@2x.png`)
            .setFields([{
                name: `**Temperature**`,
                value: [
                    `Current: **${onecall.current.temp.toFixed(1)}°C** (**${Util.toFahrenheit(onecall.current.temp)}°F**)`,
                    `Min: **${onecall.daily[0]?.temp.min.toFixed(1) ?? '∞'}°C** (**${onecall.daily[0] ? Util.toFahrenheit(onecall.daily[0].temp.min) : '∞'}°F**)`,
                    `Max: **${onecall.daily[0]?.temp.max.toFixed(1) ?? '∞'}°C** (**${onecall.daily[0] ? Util.toFahrenheit(onecall.daily[0].temp.max) : '∞'}°F**)`,
                    `Dew Point: **${onecall.current.dew_point.toFixed(1)}°C** (**${Util.toFahrenheit(onecall.current.dew_point)}°F**)`,
                    `Humidity: **${onecall.current.humidity}%**`,
                    `Pressure: **${Util.formatCommas(onecall.current.pressure)}hPa**`
                ],
                inline: true
            }, {
                name: `**Weather**`,
                value: [
                    `**${Util.capitaliseString(onecall.current.weather[0].description)}**`,
                    `Clouds: **${onecall.current.clouds}%**`,
                    `Wind Speed: **${onecall.current.wind_speed}km/h**`,
                    `Wind Deg: **${onecall.current.wind_deg}°**`,
                    `Visibility: **${Util.formatCommas(onecall.current.visibility)}m**`,
                    `UV Index: **${onecall.current.uvi}**`
                ],
                inline: true
            }]);
    }

    public static forecast({ onecall, geocode, emojis }: { onecall: OneCallData, geocode: GeocodeData, emojis: WeatherEmojiTable; }): WeatherEmbed {
        const locationString: string = OpenWeatherAPI.getLocationString(geocode, true);
        const timeString = Util.formatTimezone(onecall.timezone);
        const localeEmoji = Util.localeToEmoji(geocode.country);
        return new WeatherEmbed()
            .setTitle(`${localeEmoji} Forecast for ${locationString}`)
            .setURL(OpenWeatherAPI.getGoogleMapsLink(onecall))
            .setDescription([
                `Date/Time: **${timeString}**`,
                (onecall.current.sunrise && onecall.current.sunset ?
                    `Sunrise/Sunset: **<t:${onecall.current.sunrise}:t> - <t:${onecall.current.sunset}:t>**` :
                    `Sunrise/Sunset: ***unknown***`
                ),
                `Lat/Lon: **${onecall.lat}, ${onecall.lon}**`
            ])
            .setFields(onecall.daily.slice(0, 6).map(day => {
                const emoji = emojis.getWeatherEmoji(day.weather[0].icon);
                return {
                    name: `<t:${day.dt}:D>`,
                    value: [
                        `**${Util.capitaliseString(day.weather[0].description)}** ${emoji}`,
                        `Min: **${day.temp.min}°C** (**${Util.toFahrenheit(day.temp.min)}°F**)`,
                        `Max: **${day.temp.max}°C** (**${Util.toFahrenheit(day.temp.max)}°F**)`,
                        `Humidity: **${day.humidity}%**`
                    ],
                    inline: true
                };
            }));
    }

    public static alert({ onecall, geocode }: { onecall: OneCallData, geocode: GeocodeData; }): WeatherEmbed {
        const locationString: string = OpenWeatherAPI.getLocationString(geocode, true);
        const timeString = Util.formatTimezone(onecall.timezone);
        const localeEmoji = Util.localeToEmoji(geocode.country);
        const embed = new WeatherEmbed()
            .setURL(OpenWeatherAPI.getGoogleMapsLink(onecall));
        if (onecall.alerts && onecall.alerts[0]) {
            const alert = onecall.alerts[0];
            embed.setTitle(`${localeEmoji} ${alert.event} Warning for ${locationString} (${timeString})`);
            embed.setDescription([
                `Source: **${alert.sender_name}**`,
                `Start Time: **<t:${alert.start}:t>**`,
                `End Time: **<t:${alert.end}:t>**`
            ]);
            embed.setFields({
                name: 'Description',
                value: Util.shortenText(alert.description, { maxLength: 1024 })
            });
        } else {
            embed.setTitle(`${localeEmoji} Warning for ${locationString} (${timeString})`);
            embed.setDescription(`It looks like there is no active weather warning for \`${locationString}\`! Stay safe!`);
        }
        return embed;
    }
}
