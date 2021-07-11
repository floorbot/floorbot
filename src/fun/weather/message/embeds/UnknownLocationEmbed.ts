import { OpenWeatherAPI, LocationData } from '../../api/OpenWeatherAPI';
import { HandlerContext } from 'discord.js-commands';
import { WeatherEmbed } from '../WeatherEmbed';

export class UnknownLocationEmbed extends WeatherEmbed {

    constructor(context: HandlerContext, location: LocationData) {
        super(context);
        this.setDescription(`Sorry! I could not find \`${OpenWeatherAPI.getLocationString(location)}\`\n*Please check the spelling or try another nearby location*`);
    }
}
