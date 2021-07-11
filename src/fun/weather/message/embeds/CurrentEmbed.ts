import { OpenWeatherAPI, CurrentData } from '../../api/OpenWeatherAPI';
import { HandlerContext } from 'discord.js-commands';
import { WeatherEmbed } from '../WeatherEmbed';
import { Util } from 'discord.js';

export class CurrentEmbed extends WeatherEmbed {

    constructor(context: HandlerContext, current: CurrentData) {
        super(context);

        const dateString: string = Util.formatDate(this.getLocalDate(current.timezone), { showTime: true, showDate: false });
        const locationString: string = OpenWeatherAPI.getLocationString({
            city_name: current.name,
            state_code: current.sys.state,
            country_code: current.sys.country
        });

        this.setURL(OpenWeatherAPI.getGoogleMapsLink(current.coord));
        this.setTitle(`Weather for ${locationString} (${dateString})`);
        this.setThumbnail(`http://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`);
        this.addField(`**Temperature**`, (
            `Current: **${current.main.temp.toFixed(1)}°C** (**${Util.toFahrenheit(current.main.temp)}°F**)\n` +
            `Min: **${current.main.temp_min.toFixed(1)}°C** (**${Util.toFahrenheit(current.main.temp_min)}°F**)\n` +
            `Max: **${current.main.temp_max.toFixed(1)}°C** (**${Util.toFahrenheit(current.main.temp_max)}°F**)\n` +
            `Humidity: **${current.main.humidity}%**\n` +
            `Pressure: **${Util.formatCommas(current.main.pressure)}hPa**`
        ), true);
        this.addField(`**Weather**`, (
            `**${Util.capitalizeString(current.weather[0].description)}**\n` +
            `Clouds: **${current.clouds.all}%**\n` +
            `Wind Speed: **${current.wind.speed}km/h**\n` +
            `Wind Deg: **${current.wind.deg}°**\n` +
            `Visibility: **${Util.formatCommas(current.visibility)}m**\n`
        ), true);
    }
}
