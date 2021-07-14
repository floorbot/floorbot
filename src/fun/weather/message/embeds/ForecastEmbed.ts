import { OpenWeatherAPI, GeocodeData, OneCallData } from '../../api/OpenWeatherAPI';
import { WeatherLinkSchema } from '../../WeatherDatabase';
import { HandlerContext } from 'discord.js-commands';
import { WeatherEmbed } from './WeatherEmbed';
import { Util } from 'discord.js';

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

export class ForecastEmbed extends WeatherEmbed {

    constructor(context: HandlerContext, geocode: GeocodeData | WeatherLinkSchema, onecall: OneCallData) {
        super(context);

        const locationString: string = OpenWeatherAPI.getLocationString(geocode, true);
        const localDate = this.getLocalDate(onecall.timezone_offset);

        this.setTitle(`Forecast for ${locationString}`);
        this.setURL(OpenWeatherAPI.getGoogleMapsLink(geocode));
        this.setDescription(
            `Date/Time: **<t:${Math.floor(localDate.getTime() / 1000)}:t>**\n` +
            `Sunrise/Sunset: **<t:${onecall.current.sunrise}:t> - <t:${onecall.current.sunset}:t>**\n` +
            `Lat/Lon: **${geocode.lat}, ${geocode.lon}**\n`
        );
        onecall.daily.slice(0, 6).forEach(day => {
            const emoji = WeatherEmbed.getWeatherEmoji(context.client, day.weather[0].icon);
            this.addField(`<t:${day.dt}:D>`, (
                `**${Util.capitalizeString(day.weather[0].description)}** ${emoji}\n` +
                `Min: **${day.temp.min}°C** (**${Util.toFahrenheit(day.temp.min)}°F**)\n` +
                `Max: **${day.temp.max}°C** (**${Util.toFahrenheit(day.temp.max)}°F**)\n` +
                `Humidity: **${day.humidity}%**\n`
            ), true);
        });
    }
}
