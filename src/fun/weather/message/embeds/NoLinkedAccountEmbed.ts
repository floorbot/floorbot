import { HandlerContext } from 'discord.js-commands';
import { WeatherEmbed } from '../WeatherEmbed';

export class NoLinkedAccountEmbed extends WeatherEmbed {

    constructor(context: HandlerContext) {
        super(context);
        this.setDescription(`Sorry! There are no members with linked locations in this channel\nPlease use \`/weather link\` to start the weather leaderboard`);
    }
}
