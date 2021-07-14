import { OneCallData } from '../../api/OpenWeatherAPI';
import { HandlerContext } from 'discord.js-commands';
import { WeatherEmbed } from './WeatherEmbed';
import { Util } from 'discord.js';

export class AlertEmbed extends WeatherEmbed {

    constructor(context: HandlerContext, alert: OneCallData['alerts'][0]) {
        super(context);

        this.setTitle(`${alert.event} Warning from ${alert.sender_name} (<t:${alert.start}:t> - <t:${alert.end}:t>)`);
        this.setDescription(Util.splitMessage(alert.description, {
            append: '...',
            char: '',
            maxLength: 4096
        })[0]);
    }
}
