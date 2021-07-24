import { WeatherLinkSchema, OpenWeatherAPI, GeocodeData, OneCallData } from '../../../../..';
import { HandlerContext } from 'discord.js-commands';
import { MessageEmbed, Util } from 'discord.js';

export class AlertEmbed extends MessageEmbed {

    constructor(_context: HandlerContext, geocode: GeocodeData | WeatherLinkSchema, onecall: OneCallData) {
        super();

        const locationString: string = OpenWeatherAPI.getLocationString(geocode, true);
        const timeString = this.formatTiemzoneOffset(onecall.timezone_offset);
        const localeEmoji = Util.localeToEmoji(geocode.country);

        this.setURL(OpenWeatherAPI.getGoogleMapsLink(geocode));
        if (onecall.alerts && onecall.alerts.length) {
            const alert = onecall.alerts[0]!;
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
                })[0]!);
        } else {
            this.setTitle(`No Weather Warning for ${locationString} (${timeString})`);
            this.setDescription(`It looks like there is no active weather warning for \`${locationString}\`! Stay safe!`)
        }
    }

    public formatTiemzoneOffset(offset: number): string {
        const now = new Date();
        const time = now.getTime();
        const appOffset = now.getTimezoneOffset();
        const date = new Date(time + (appOffset * 60 * 1000) + (offset * 1000));
        return Util.formatDate(date, { showTime: true, showDate: false, fullName: false });
    }
}
