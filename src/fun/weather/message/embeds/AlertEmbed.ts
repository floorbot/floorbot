import { GeocodeData, OneCallData, OpenWeatherAPI } from '../../api/OpenWeatherAPI';
import { WeatherLinkSchema } from '../../WeatherDatabase';
import { HandlerContext } from 'discord.js-commands';
import { WeatherEmbed } from './WeatherEmbed';
import { Util } from 'discord.js';

export class AlertEmbed extends WeatherEmbed {

    constructor(context: HandlerContext, geocode: GeocodeData | WeatherLinkSchema, onecall: OneCallData) {
        super(context);

        const locationString: string = OpenWeatherAPI.getLocationString(geocode, true);
        const timeString = this.formatTiemzoneOffset(onecall.timezone_offset);
        const localeEmoji = Util.localeToEmoji(geocode.country);

        this.setURL(OpenWeatherAPI.getGoogleMapsLink(geocode));
        if (onecall.alerts && onecall.alerts.length) {
            const alert = onecall.alerts[0];
            this.setTitle(`${localeEmoji} ${alert.event} Warning for ${locationString} (${timeString})`);
            this.setDescription(Util.splitMessage([
                `Source: **${alert.sender_name}**`,
                `Start Time: **<t:${alert.start}:t>**`,
                `End Time: **<t:${alert.end}:t>**`,
                'Description:',
                alert.description
            ].join('\n'), {
                    append: '...',
                    char: '',
                    maxLength: 4096
                })[0]);
        } else {
            this.setTitle(`No Weather Warning for ${locationString} (${timeString})`);
            this.setDescription(`It looks like there is no active weather warning for \`${locationString}\`! Stay safe!`)
        }
    }
}
