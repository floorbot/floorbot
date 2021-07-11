import { OpenWeatherAPI, ForecastData, ForecastDataEntry } from '../../api/OpenWeatherAPI';
import { HandlerContext } from 'discord.js-commands';
import { WeatherEmbed } from '../WeatherEmbed';
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

    constructor(context: HandlerContext, forecast: ForecastData, days: Array<ForecastDay>) {
        super(context);

        const dateString: string = Util.formatDate(this.getLocalDate(forecast.city.timezone), { showTime: true, showDate: false });
        const sunriseString: string = Util.formatDate(forecast.city.sunrise, { showTime: true, showDate: false });
        const sunsetString: string = Util.formatDate(forecast.city.sunset, { showTime: true, showDate: false });
        const locationString: string = OpenWeatherAPI.getLocationString({
            city_name: forecast.city.name,
            state_code: forecast.city.state,
            country_code: forecast.city.country
        });
        this.setTitle(`Forecast for ${locationString}`);
        this.setURL(OpenWeatherAPI.getGoogleMapsLink(forecast.city.coord));
        this.setDescription(
            `Date/Time: **${dateString}**\n` +
            `${forecast.city.population ? `Population: **${Util.formatCommas(forecast.city.population)}**\n` : ''}` +
            `Sunrise/Sunset: **${sunriseString} - ${sunsetString}**\n` +
            `Lat/Lon: **${forecast.city.coord.lat}, ${forecast.city.coord.lon}**\n`
        );
        days.forEach((day: ForecastDay) => {
            this.addField(Util.formatDate(new Date(day.dt_txt)), (
                `**${day.description}** ${day.emoji}\n` +
                `Min: **${day.temp_min}°C** (**${day.temp_min_f}°F**)\n` +
                `Max: **${day.temp_max}°C** (**${day.temp_max_f}°F**)\n` +
                `Humidity: **${day.averageHumidity}%**\n`
            ), true);
        });
    }

    public static async generateEmbed(context: HandlerContext, forecast: ForecastData) {
        const days: Array<ForecastDay> = await ForecastEmbed.mapForecastStats(context, forecast);
        return new ForecastEmbed(context, forecast, days);
    }

    public static async mapForecastStats(context: HandlerContext, forecast: ForecastData): Promise<Array<ForecastDay>> {
        const days = ForecastEmbed.mapForecastTimestamps(forecast);
        return Promise.all(Array.from(days, async ([day, timestamps]) => {
            const weatherID = Number(Util.arrayMode(timestamps.map((part: ForecastDataEntry) => part.weather[0].id)));
            const weather = timestamps.find((part: ForecastDataEntry) => part.weather[0].id === weatherID)!.weather[0];
            const temp_min = Number(timestamps.reduce((found: any, current: any) => current.main.temp_min < found.main.temp_min ? current : found).main.temp_min).toFixed(1);
            const temp_max = Number(timestamps.reduce((found: any, current: any) => current.main.temp_max > found.main.temp_max ? current : found).main.temp_min).toFixed(1);
            const averageHumidity = Math.round(Util.propAverage(timestamps.map((part: any) => part.main), 'humidity')).toString();
            const temp_min_f = Math.round((Number(temp_min)) * 9 / 5 + 32).toString();
            const temp_max_f = Math.round((Number(temp_max)) * 9 / 5 + 32).toString();
            const description = Util.capitalizeString(weather.description);
            const dt_txt = timestamps[0].dt_txt;
            const icon = weather.icon;
            const emoji = await WeatherEmbed.getWeatherEmoji(context.client, icon)
            return { day, dt_txt, temp_min, temp_max, averageHumidity, temp_min_f, temp_max_f, description, icon, emoji };
        }));
    }

    private static mapForecastTimestamps(forecast: ForecastData): Map<number, Array<ForecastDataEntry>> {
        return forecast.list.reduce((map, timestamp) => {
            const date = new Date(timestamp.dt_txt);
            const day = date.getDay();
            if (!map.has(day)) map.set(day, []);
            map.get(day).push(timestamp);
            return map;
        }, new Map());
    }
}
