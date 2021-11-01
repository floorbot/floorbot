import { GeocodeData, LocationData, OneCallData, OpenWeatherAPI, WeatherAPIError } from '../api/OpenWeatherAPI';
import { Util, GuildMember, GuildChannel, MessageEmbed, MessageEmbedOptions } from 'discord.js';
import { HandlerEmbed } from '../../../../components/HandlerEmbed';
import { HandlerContext } from '../../../../discord/Util';
import { OpenWeatherData } from '../WeatherHandler';
import { WeatherEmojis } from '../WeatherEmojis';
import { WeatherLinkSchema } from '../WeatherDatabase';

export class WeatherEmbed extends HandlerEmbed {

    constructor(context: HandlerContext, data?: MessageEmbed | MessageEmbedOptions) {
        super(data);
        this.setContextAuthor(context);
        this.setFooter('Powered by OpenWeatherMap', 'https://openweathermap.org/themes/openweathermap/assets/img/logo_white_cropped.png');
    }

    public static formatTiemzoneOffset(offset: number): string {
        const now = new Date();
        const time = now.getTime();
        const appOffset = now.getTimezoneOffset();
        const date = new Date(time + (appOffset * 60 * 1000) + (offset * 1000));
        return Util.formatDate(date, { showTime: true, showDate: false, fullName: false });
    }

    public static getUnknownLocationEmbed(context: HandlerContext, location: LocationData): HandlerEmbed {
        return new WeatherEmbed(context)
            .setDescription(`Sorry! I could not find \`${OpenWeatherAPI.getLocationString(location, true)}\`\n*Please check the spelling or try another nearby location*`);
    }

    public static getMissingAdminEmbed(context: HandlerContext): HandlerEmbed {
        return new WeatherEmbed(context)
            .setDescription(`Sorry! you must be an admin to force link or unlink locations from other people!`);
    }

    public static getMissingParamsEmbed(context: HandlerContext, member: GuildMember): HandlerEmbed {
        return new WeatherEmbed(context)
            .setDescription(`Sorry! I do not have a saved location for ${member}. Please use \`/weather link\` to set one!`);
    }

    public static getAPIErrorEmbed(context: HandlerContext, error: WeatherAPIError): HandlerEmbed {
        return new WeatherEmbed(context).setDescription([
            `Sorry I seem to have an API issue:`,
            `*${error.message}*`
        ].join('\n'));
    }

    public static getNoLinkedMembersEmbed(context: HandlerContext, channel: GuildChannel): HandlerEmbed {
        return new WeatherEmbed(context).setDescription([
            `There are no members with saved locations in ${channel}`,
            'Please use \`/weather link\` to start the weather leaderboard!'
        ].join('\n'));
    }

    public static getLinkedEmbed(context: HandlerContext, geocode: GeocodeData, member: GuildMember): HandlerEmbed {
        return new WeatherEmbed(context)
            .setDescription(`Succesfully linked location \`${OpenWeatherAPI.getLocationString(geocode, true)}\` to ${member} 🥳`);
    }

    public static getUnlinkedEmbed(context: HandlerContext, member: GuildMember): HandlerEmbed {
        return new WeatherEmbed(context)
            .setDescription(`Succesfully unlinked any saved location from ${member} 🤠`);
    }

    public static getServerTempsEmbed(context: HandlerContext, links: [OneCallData, GuildMember, WeatherLinkSchema][]): WeatherEmbed {
        const embed = new WeatherEmbed(context);
        embed.setAuthor(`Temps for ${context.guild!.name}`, context.guild!.iconURL()!);
        embed.addField('Location/Person', (
            links.map(([weather, member, link]) => {
                const timeString = WeatherEmbed.formatTiemzoneOffset(weather.timezone_offset);
                const localeEmoji = Util.localeToEmoji(link.country);
                return `${localeEmoji} ${timeString} ${member}`
            }).join('\n')
        ), true);
        embed.addField('Temp/Humidity', (
            links.map(([weather, _member]) => {
                return `${WeatherEmojis.getWeatherEmoji(context.client, weather.current.weather[0].icon)} ${weather.current.temp.toFixed(2)}°C (${Util.toFahrenheit(weather.current.temp)}°F) ${weather.current.humidity}%`
            }).join('\n')
        ), true);
        return embed;
    }

    public static getCurrentEmbed(context: HandlerContext, weather: OpenWeatherData): WeatherEmbed {
        const embed = new WeatherEmbed(context);
        const locationString: string = OpenWeatherAPI.getLocationString(weather, true);
        const dateString = WeatherEmbed.formatTiemzoneOffset(weather.timezone_offset)
        const localeEmoji = Util.localeToEmoji(weather.country);
        embed.setURL(OpenWeatherAPI.getGoogleMapsLink(weather));
        embed.setTitle(`${localeEmoji} Weather for ${locationString} (${dateString})`);
        embed.setThumbnail(`http://openweathermap.org/img/wn/${weather.current.weather[0].icon}@2x.png`);
        embed.addField(`**Temperature**`, (
            `Current: **${weather.current.temp.toFixed(1)}°C** (**${Util.toFahrenheit(weather.current.temp)}°F**)\n` +
            `Min: **${weather.daily[0]!.temp.min.toFixed(1)}°C** (**${Util.toFahrenheit(weather.daily[0]!.temp.min)}°F**)\n` +
            `Max: **${weather.daily[0]!.temp.max.toFixed(1)}°C** (**${Util.toFahrenheit(weather.daily[0]!.temp.max)}°F**)\n` +
            `Dew Point: **${weather.current.dew_point.toFixed(1)}°C** (**${Util.toFahrenheit(weather.current.dew_point)}°F**)\n` +
            `Humidity: **${weather.current.humidity}%**\n` +
            `Pressure: **${Util.formatCommas(weather.current.pressure)}hPa**`
        ), true);
        embed.addField(`**Weather**`, (
            `**${Util.capitalizeString(weather.current.weather[0].description)}**\n` +
            `Clouds: **${weather.current.clouds}%**\n` +
            `Wind Speed: **${weather.current.wind_speed}km/h**\n` +
            `Wind Deg: **${weather.current.wind_deg}°**\n` +
            `Visibility: **${Util.formatCommas(weather.current.visibility)}m**\n` +
            `UV Index: **${weather.current.uvi}**`
        ), true);

        return embed;
    }

    public static getForecastEmbed(context: HandlerContext, weather: OpenWeatherData): WeatherEmbed {
        const embed = new WeatherEmbed(context);
        const locationString: string = OpenWeatherAPI.getLocationString(weather, true);
        const timeString = WeatherEmbed.formatTiemzoneOffset(weather.timezone_offset)
        const localeEmoji = Util.localeToEmoji(weather.country);
        embed.setTitle(`${localeEmoji} Forecast for ${locationString}`);
        embed.setURL(OpenWeatherAPI.getGoogleMapsLink(weather));
        embed.setDescription(
            `Date/Time: **${timeString}**\n` +
            (weather.current.sunrise && weather.current.sunset ?
                `Sunrise/Sunset: **<t:${weather.current.sunrise}:t> - <t:${weather.current.sunset}:t>**\n` :
                `Sunrise/Sunset: ***unknown***\n`
            ) +
            `Lat/Lon: **${weather.lat}, ${weather.lon}**\n`
        );
        weather.daily.slice(0, 6).forEach(day => {
            const emoji = WeatherEmojis.getWeatherEmoji(context.client, day.weather[0].icon);
            embed.addField(`<t:${day.dt}:D>`, (
                `**${Util.capitalizeString(day.weather[0].description)}** ${emoji}\n` +
                `Min: **${day.temp.min}°C** (**${Util.toFahrenheit(day.temp.min)}°F**)\n` +
                `Max: **${day.temp.max}°C** (**${Util.toFahrenheit(day.temp.max)}°F**)\n` +
                `Humidity: **${day.humidity}%**\n`
            ), true);
        });
        return embed;
    }

    public static getAirPullutionEmbed(context: HandlerContext, weather: OpenWeatherData): WeatherEmbed {
        const embed = new WeatherEmbed(context);
        const locationString = OpenWeatherAPI.getLocationString(weather, true);
        const aqiString = embed.getAQIString(weather.list[0]!.main.aqi);
        const localeEmoji = Util.localeToEmoji(weather.country);
        embed.setTitle(`${localeEmoji} Air Quality for ${locationString} (${aqiString})`);
        embed.setURL(OpenWeatherAPI.getGoogleMapsLink(weather));
        embed.addField('Name', (
            `(CO) Carbon monoxide\n` +
            `(NO) Nitrogen monoxide\n` +
            `(NO₂) Nitrogen dioxide\n` +
            `(O₃) Ozone\n` +
            `(SO₂) Sulphur dioxide\n` +
            `(PM₂.₅) Fine particles matter\n` +
            `(PM₁₀) Coarse particulate matter\n` +
            `(NH₃) Ammonia\n`
        ), true);
        const components = weather.list[0]!.components;
        embed.addField('Quantity', (
            `${WeatherEmojis.getQualityEmoji(context.client, embed.getCO(components.co))} ${components.co} μg/m³\n` +
            `${WeatherEmojis.getQualityEmoji(context.client, embed.getNO(components.no))} ${components.no} μg/m³\n` +
            `${WeatherEmojis.getQualityEmoji(context.client, embed.getNO2(components.no2))} ${components.no2} μg/m³\n` +
            `${WeatherEmojis.getQualityEmoji(context.client, embed.getO3(components.o3))} ${components.o3} μg/m³\n` +
            `${WeatherEmojis.getQualityEmoji(context.client, embed.getSO2(components.so2))} ${components.so2} μg/m³\n` +
            `${WeatherEmojis.getQualityEmoji(context.client, embed.getPM2_5(components.pm2_5))} ${components.pm2_5} μg/m³\n` +
            `${WeatherEmojis.getQualityEmoji(context.client, embed.getPM10(components.pm10))} ${components.pm10} μg/m³\n` +
            `${WeatherEmojis.getQualityEmoji(context.client, embed.getNH3(components.nh3))} ${components.nh3} μg/m³\n`
        ), true)
        return embed;
    }

    public static getAlertEmbed(context: HandlerContext, weather: OpenWeatherData): WeatherEmbed {
        const embed = new WeatherEmbed(context);
        const locationString: string = OpenWeatherAPI.getLocationString(weather, true);
        const timeString = WeatherEmbed.formatTiemzoneOffset(weather.timezone_offset);
        const localeEmoji = Util.localeToEmoji(weather.country);
        embed.setURL(OpenWeatherAPI.getGoogleMapsLink(weather));
        if (weather.alerts && weather.alerts.length) {
            const alert = weather.alerts[0]!;
            embed.setTitle(`${localeEmoji} ${alert.event} Warning for ${locationString} (${timeString})`);
            embed.setDescription(Util.splitMessage([
                `Source: **${alert.sender_name}**`,
                `Start Time: **<t:${alert.start}:t>**`,
                `End Time: **<t:${alert.end}:t>**`,
                'Description:',
                alert.description
            ].join('\n'), {
                    append: '...',
                    char: '',
                    maxLength: 4096
                })[0]!);
        } else {
            embed.setTitle(`No Weather Warning for ${locationString} (${timeString})`);
            embed.setDescription(`It looks like there is no active weather warning for \`${locationString}\`! Stay safe!`)
        }
        return embed;
    }

    private getAQIString(aqi: number): string {
        switch (aqi) {
            case 1: { return 'Good' }
            case 2: { return 'Fair' }
            case 3: { return 'Moderate' }
            case 4: { return 'Poor' }
            case 5: { return 'Very Poor' }
            default: { return '*unknown*' }
        }
    }

    private getCO(co: number): number {
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

    private getNO(no: number): number {
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

    private getNO2(no2: number): number {
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

    private getO3(o3: number): number {
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

    private getSO2(so2: number): number {
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

    private getPM2_5(pm2_5: number): number {
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

    private getPM10(pm10: number): number {
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

    private getNH3(nh3: number): number {
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