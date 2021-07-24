import { WeatherEmojis, WeatherLinkSchema, OpenWeatherAPI, GeocodeData, OneCallData } from '../../../../..';
import { HandlerContext } from 'discord.js-commands';
import { MessageEmbed, Util } from 'discord.js';

export interface ForecastDay {
    readonly day: number,
    readonly temp_min: string,
    readonly temp_max: string,
    readonly averageHumidity: string,
    readonly temp_min_f: string,
    readonly temp_max_f: string,
    readonly description: string,
    readonly dt_txt: string,
    readonly icon: string,
    readonly emoji: string
}

export class ForecastEmbed extends MessageEmbed {

    constructor(context: HandlerContext, geocode: GeocodeData | WeatherLinkSchema, onecall: OneCallData) {
        super();

        const locationString: string = OpenWeatherAPI.getLocationString(geocode, true);
        const timeString = this.formatTiemzoneOffset(onecall.timezone_offset)
        const localeEmoji = Util.localeToEmoji(geocode.country);

        this.setTitle(`${localeEmoji} Forecast for ${locationString}`);
        this.setURL(OpenWeatherAPI.getGoogleMapsLink(geocode));
        this.setDescription(
            `Date/Time: **${timeString}**\n` +
            (onecall.current.sunrise && onecall.current.sunset ?
                `Sunrise/Sunset: **<t:${onecall.current.sunrise}:t> - <t:${onecall.current.sunset}:t>**\n` :
                `Sunrise/Sunset: ***unknown***\n`
            ) +
            `Lat/Lon: **${geocode.lat}, ${geocode.lon}**\n`
        );
        onecall.daily.slice(0, 6).forEach(day => {
            const emoji = WeatherEmojis.getWeatherEmoji(context.client, day.weather[0].icon);
            this.addField(`<t:${day.dt}:D>`, (
                `**${Util.capitalizeString(day.weather[0].description)}** ${emoji}\n` +
                `Min: **${day.temp.min}°C** (**${Util.toFahrenheit(day.temp.min)}°F**)\n` +
                `Max: **${day.temp.max}°C** (**${Util.toFahrenheit(day.temp.max)}°F**)\n` +
                `Humidity: **${day.humidity}%**\n`
            ), true);
        });
    }

    public formatTiemzoneOffset(offset: number): string {
        const now = new Date();
        const time = now.getTime();
        const appOffset = now.getTimezoneOffset();
        const date = new Date(time + (appOffset * 60 * 1000) + (offset * 1000));
        return Util.formatDate(date, { showTime: true, showDate: false, fullName: false });
    }
}
