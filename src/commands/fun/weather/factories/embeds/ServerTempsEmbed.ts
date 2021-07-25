import { WeatherEmojis, WeatherHandler, WeatherLinkSchema, OpenWeatherAPI, OneCallData, WeatherEmbedFactory, WeatherAPIError } from '../../../../..';
import { HandlerContext, HandlerEmbed } from 'discord.js-commands';
import { Util, GuildMember } from 'discord.js';

export class ServerTempsEmbed extends HandlerEmbed {

    constructor(handler: WeatherHandler, context: HandlerContext, data: Array<[WeatherLinkSchema, GuildMember, OneCallData | WeatherAPIError]>) {
        super(handler.getEmbedTemplate(context));

        this.setAuthor(`Temps for ${context.guild!.name}`, context.guild!.iconURL()!);
        this.addField('Location/Person', (
            data.map(([geo, member, onecall]) => {
                if (OpenWeatherAPI.isError(onecall)) return `🏳️‍🌈 00:00am ${member}`
                const timeString = WeatherEmbedFactory.formatTiemzoneOffset(onecall.timezone_offset);
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
}
