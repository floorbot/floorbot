import { LocationQuery, OpenWeatherAPI } from '../open_weather/OpenWeatherAPI.js';
import { AirPollutionData } from '../open_weather/interfaces/AirPollutionData.js';
import { EmbedBuilder } from '../../../lib/discord.js/builders/EmbedBuilder.js';
import { WeatherAPIError } from '../open_weather/interfaces/WeatherAPIError.js';
import { OneCallData } from '../open_weather/interfaces/OneCallData.js';
import { GeocodeData } from '../open_weather/interfaces/GeocodeData.js';
import { EmbedFooterOptions, GuildMember, User } from 'discord.js';
import { WeatherEmojiTable } from '../tables/WeatherEmojiTable.js';
import { Pageable } from '../../../helpers/pageable/Pageable.js';
import WeatherLinkRow from '../tables/WeatherLinkTable.js';
import { Util } from '../../../helpers/Util.js';

export class WeatherEmbed extends EmbedBuilder {

    constructor(pageable?: Pageable<any>) {
        super();
        this.setFooter(pageable ?? null);
    }

    public override setFooter(options: EmbedFooterOptions | { text: string[]; } | Pageable<any> | null): this {
        const iconURL = 'https://openweathermap.org/themes/openweathermap/assets/img/logo_white_cropped.png';
        if (options instanceof Pageable && options.totalPages - 1) return super.setFooter({ text: `${options.currentPage}/${options.totalPages} - Powered by OpenWeatherMap`, iconURL });
        return super.setFooter((options instanceof Pageable ? null : options) ?? { text: `Powered by OpenWeatherMap`, iconURL });
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

    public static missingLinkedMembers(): WeatherEmbed {
        return new WeatherEmbed()
            .setDescription([
                'There are no members in this guild with saved locations',
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

    public static allTemps(pageable: Pageable<[OneCallData, GuildMember, WeatherLinkRow]>, emojiTable: WeatherEmojiTable): WeatherEmbed {
        const guild = pageable.array[0][1].guild;
        return new WeatherEmbed(pageable)
            .setAuthor({ name: `Temps for ${guild.name}`, iconURL: guild.iconURL() ?? undefined })
            .setDescription(pageable.getPage().map(([onecall, member, link]) => {
                const timeString = Util.formatTimezone(onecall.timezone);
                const localeEmoji = Util.localeToEmoji(link.country);
                const weatherEmoji = emojiTable.getWeatherEmoji(onecall.current.weather[0].icon);
                const tempString = `${onecall.current.temp.toFixed(2)}°C`.padEnd(8); // -99.99°C
                const tempStringF = `(${Util.toFahrenheit(onecall.current.temp)}°F)`.padEnd(7); // (999°F)
                const humidityString = `${onecall.current.humidity}%`.padEnd(4); // 100%
                return `${localeEmoji} \`${timeString}\` ${weatherEmoji} \`${tempString} ${tempStringF} ${humidityString}\` ${member}`;
            }));
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

    public static forecast({ onecall, geocode, emojiTable }: { onecall: OneCallData, geocode: GeocodeData, emojiTable: WeatherEmojiTable; }): WeatherEmbed {
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
                const emoji = emojiTable.getWeatherEmoji(day.weather[0].icon);
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

    public static airQuality({ geocode, airQuality, emojiTable }: { geocode: GeocodeData, airQuality: AirPollutionData, emojiTable: WeatherEmojiTable; }): WeatherEmbed {
        const locationString: string = OpenWeatherAPI.getLocationString(geocode, true);
        const aqiString = WeatherEmbed.getAQIString(airQuality.list[0]?.main.aqi ?? 0);
        const localeEmoji = Util.localeToEmoji(geocode.country);
        const components = airQuality.list[0]?.components || null;
        return new WeatherEmbed()
            .setTitle(`${localeEmoji} Air Quality for ${locationString} (${aqiString})`)
            .setURL(OpenWeatherAPI.getGoogleMapsLink(geocode))
            .addFields({
                name: 'Name', value: (
                    `(CO) Carbon monoxide\n` +
                    `(NO) Nitrogen monoxide\n` +
                    `(NO₂) Nitrogen dioxide\n` +
                    `(O₃) Ozone\n` +
                    `(SO₂) Sulphur dioxide\n` +
                    `(PM₂.₅) Fine particles matter\n` +
                    `(PM₁₀) Coarse particulate matter\n` +
                    `(NH₃) Ammonia\n`
                ), inline: true
            })
            .addFields({
                name: 'Quantity', value: components ? [
                    `${emojiTable.getQualityEmoji(WeatherEmbed.getCO(components.co))} ${components.co} μg/m³`,
                    `${emojiTable.getQualityEmoji(WeatherEmbed.getNO(components.no))} ${components.no} μg/m³`,
                    `${emojiTable.getQualityEmoji(WeatherEmbed.getNO2(components.no2))} ${components.no2} μg/m³`,
                    `${emojiTable.getQualityEmoji(WeatherEmbed.getO3(components.o3))} ${components.o3} μg/m³`,
                    `${emojiTable.getQualityEmoji(WeatherEmbed.getSO2(components.so2))} ${components.so2} μg/m³`,
                    `${emojiTable.getQualityEmoji(WeatherEmbed.getPM2_5(components.pm2_5))} ${components.pm2_5} μg/m³`,
                    `${emojiTable.getQualityEmoji(WeatherEmbed.getPM10(components.pm10))} ${components.pm10} μg/m³`,
                    `${emojiTable.getQualityEmoji(WeatherEmbed.getNH3(components.nh3))} ${components.nh3} μg/m³`
                ] : 'Sorry, it looks like I do not have any air pollution data', inline: true
            });
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

    private static getAQIString(aqi: number): string {
        switch (aqi) {
            case 1: { return 'Good'; }
            case 2: { return 'Fair'; }
            case 3: { return 'Moderate'; }
            case 4: { return 'Poor'; }
            case 5: { return 'Very Poor'; }
            default: { return '*unknown*'; }
        }
    }

    private static getCO(co: number): number {
        if (co >= 5000) return 13;
        if (co >= 3600) return 12;
        if (co >= 2000) return 11;
        if (co >= 1200) return 10;
        if (co >= 800) return 9;
        if (co >= 600) return 8;
        if (co >= 475) return 7;
        if (co >= 375) return 6;
        if (co >= 300) return 5;
        if (co >= 250) return 4;
        if (co >= 210) return 3;
        if (co >= 175) return 2;
        return 1;
    }

    private static getNO(no: number): number {
        if (no >= 150) return 13;
        if (no >= 100) return 12;
        if (no >= 75) return 11;
        if (no >= 50) return 10;
        if (no >= 25) return 9;
        if (no >= 15) return 8;
        if (no >= 10) return 7;
        if (no >= 5) return 6;
        if (no >= 3) return 5;
        if (no >= 1) return 4;
        if (no >= 0.5) return 3;
        if (no >= 0.01) return 2;
        return 1;
    }

    private static getNO2(no2: number): number {
        if (no2 >= 300) return 13;
        if (no2 >= 200) return 12;
        if (no2 >= 150) return 11;
        if (no2 >= 100) return 10;
        if (no2 >= 75) return 9;
        if (no2 >= 50) return 8;
        if (no2 >= 25) return 7;
        if (no2 >= 10) return 6;
        if (no2 >= 5) return 5;
        if (no2 >= 2.5) return 4;
        if (no2 >= 1.25) return 3;
        if (no2 >= 0.5) return 2;
        return 1;
    }

    private static getO3(o3: number): number {
        if (o3 >= 250) return 13;
        if (o3 >= 200) return 12;
        if (o3 >= 150) return 11;
        if (o3 >= 125) return 10;
        if (o3 >= 100) return 9;
        if (o3 >= 80) return 8;
        if (o3 >= 65) return 7;
        if (o3 >= 50) return 6;
        if (o3 >= 35) return 5;
        if (o3 >= 25) return 4;
        if (o3 >= 16) return 3;
        if (o3 >= 8) return 2;
        return 1;
    }

    private static getSO2(so2: number): number {
        if (so2 >= 225) return 13;
        if (so2 >= 150) return 12;
        if (so2 >= 110) return 11;
        if (so2 >= 80) return 10;
        if (so2 >= 55) return 9;
        if (so2 >= 35) return 8;
        if (so2 >= 20) return 7;
        if (so2 >= 10) return 6;
        if (so2 >= 5) return 5;
        if (so2 >= 2.5) return 4;
        if (so2 >= 1) return 3;
        if (so2 >= 0.15) return 2;
        return 1;
    }

    private static getPM2_5(pm2_5: number): number {
        if (pm2_5 >= 500) return 13;
        if (pm2_5 >= 300) return 12;
        if (pm2_5 >= 150) return 11;
        if (pm2_5 >= 100) return 10;
        if (pm2_5 >= 75) return 9;
        if (pm2_5 >= 50) return 8;
        if (pm2_5 >= 35) return 7;
        if (pm2_5 >= 20) return 6;
        if (pm2_5 >= 10) return 5;
        if (pm2_5 >= 5) return 4;
        if (pm2_5 >= 2.5) return 3;
        if (pm2_5 >= 1) return 2;
        return 1;
    }

    private static getPM10(pm10: number): number {
        if (pm10 >= 1000) return 13;
        if (pm10 >= 600) return 12;
        if (pm10 >= 300) return 11;
        if (pm10 >= 150) return 10;
        if (pm10 >= 100) return 9;
        if (pm10 >= 75) return 8;
        if (pm10 >= 50) return 7;
        if (pm10 >= 25) return 6;
        if (pm10 >= 12.5) return 5;
        if (pm10 >= 6) return 4;
        if (pm10 >= 3) return 3;
        if (pm10 >= 1.25) return 2;
        return 1;
    }

    private static getNH3(nh3: number): number {
        if (nh3 >= 150) return 13;
        if (nh3 >= 110) return 12;
        if (nh3 >= 80) return 11;
        if (nh3 >= 55) return 10;
        if (nh3 >= 35) return 9;
        if (nh3 >= 20) return 8;
        if (nh3 >= 10) return 7;
        if (nh3 >= 5) return 6;
        if (nh3 >= 2.5) return 5;
        if (nh3 >= 1) return 4;
        if (nh3 >= 0.5) return 3;
        if (nh3 >= 0.05) return 2;
        return 1;
    }
}
