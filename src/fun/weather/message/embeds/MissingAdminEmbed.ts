import { HandlerContext } from 'discord.js-commands';
import { WeatherEmbed } from '../WeatherEmbed';

export class MissingAdminEmbed extends WeatherEmbed {

    constructor(context: HandlerContext) {
        super(context);
        this.setDescription(`Sorry! you must be an admin to force link or unlink locations from other people!`);
    }
}
