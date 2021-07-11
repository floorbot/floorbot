import { HandlerContext } from 'discord.js-commands';
import { WeatherEmbed } from '../WeatherEmbed';

export class MissingParamsEmbed extends WeatherEmbed {

    constructor(context: HandlerContext) {
        super(context);
        this.setDescription('Please provide a valid location or link one to your account with \`/weather link\`');
    }
}
