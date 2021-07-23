import { WeatherEmojis, WeatherLinkSchema, OpenWeatherAPI, OneCallData, WeatherAPIError } from '../../../../..';
import { HandlerContext } from 'discord.js-commands';
import { MessageEmbed, Util, GuildMember } from 'discord.js';

export class ServerTempsEmbed extends MessageEmbed {

    constructor(context: HandlerContext, data: Array<[WeatherLinkSchema, GuildMember, OneCallData | WeatherAPIError]>) {
        super();
        this.setAuthor(`Temps for ${context.guild!.name}`, context.guild!.iconURL()!);
        this.addField('Location/Person', (
            data.map(([geo, member, onecall]) => {
                if (OpenWeatherAPI.isError(onecall)) return `🏳️‍🌈 00:00am ${member}`
                const timeString = this.formatTiemzoneOffset(onecall.timezone_offset);
                const localeEmoji = Util.localeToEmoji(geo.country);
                return `${localeEmoji} ${timeString} ${member}`
            }).join('\n')
        ), true);
        this.addField('Temp/Humidity', (
            data.map(([_geo, _member, onecall]) => {
                if (OpenWeatherAPI.isError(onecall)) return `${WeatherEmojis.getWeatherEmoji(context.client, null)} *unknown location*`
                return `${WeatherEmojis.getWeatherEmoji(context.client, onecall.current.weather[0].icon)} ${onecall.current.temp.toFixed(2)}°C (${Util.toFahrenheit(onecall.current.temp)}°F) ${onecall.current.humidity}%`
            }).join('\n')
        ), true);
    }

    public formatTiemzoneOffset(offset: number): string {
        const now = new Date();
        const time = now.getTime();
        const appOffset = now.getTimezoneOffset();
        const date = new Date(time + (appOffset * 60 * 1000) + (offset * 1000));
        return Util.formatDate(date, { showTime: true, showDate: false, fullName: false });
    }
}
