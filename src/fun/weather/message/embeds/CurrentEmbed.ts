import { OpenWeatherAPI, OneCallData, GeocodeData } from '../../api/OpenWeatherAPI';
import { WeatherLinkSchema } from '../../WeatherDatabase';
import { HandlerContext } from 'discord.js-commands';
import { WeatherEmbed } from './WeatherEmbed';
import { Util } from 'discord.js';

export class CurrentEmbed extends WeatherEmbed {

    constructor(context: HandlerContext, geocode: GeocodeData | WeatherLinkSchema, onecall: OneCallData) {
        super(context);

        const locationString: string = OpenWeatherAPI.getLocationString(geocode, true);
        const localDate = this.getLocalDate(onecall.timezone_offset);

        this.setURL(OpenWeatherAPI.getGoogleMapsLink(geocode));
        this.setTitle(`Weather for ${locationString} (<t:${Math.floor(localDate.getTime() / 1000)}:t>)`);
        this.setThumbnail(`http://openweathermap.org/img/wn/${onecall.current.weather[0].icon}@2x.png`);
        this.addField(`**Temperature**`, (
            `Current: **${onecall.current.temp.toFixed(1)}°C** (**${Util.toFahrenheit(onecall.current.temp)}°F**)\n` +
            `Min: **${onecall.daily[0].temp.min.toFixed(1)}°C** (**${Util.toFahrenheit(onecall.daily[0].temp.min)}°F**)\n` +
            `Max: **${onecall.daily[0].temp.max.toFixed(1)}°C** (**${Util.toFahrenheit(onecall.daily[0].temp.max)}°F**)\n` +
            `Dew Point: **${onecall.current.dew_point.toFixed(1)}°C** (**${Util.toFahrenheit(onecall.current.dew_point)}°F**)\n` +
            `Humidity: **${onecall.current.humidity}%**\n` +
            `Pressure: **${Util.formatCommas(onecall.current.pressure)}hPa**`
        ), true);
        this.addField(`**Weather**`, (
            `**${Util.capitalizeString(onecall.current.weather[0].description)}**\n` +
            `Clouds: **${onecall.current.clouds}%**\n` +
            `Wind Speed: **${onecall.current.wind_speed}km/h**\n` +
            `Wind Deg: **${onecall.current.wind_deg}°**\n` +
            `Visibility: **${Util.formatCommas(onecall.current.visibility)}m**\n` +
            `UV Index: **${onecall.current.uvi}**`
        ), true);
    }
}
