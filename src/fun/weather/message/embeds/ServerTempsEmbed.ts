import { Util, GuildMember, MessageEmbed } from 'discord.js';
import { WeatherLinkSchema } from '../../WeatherDatabase';
import { OneCallData, WeatherAPIError, OpenWeatherAPI } from '../../api/OpenWeatherAPI';
import { HandlerContext } from 'discord.js-commands';
import { WeatherEmbed } from './WeatherEmbed';

export enum ServerTempsEmbedOrder {
    HUMIDITY = 'humidity',
    HOTTEST = 'hottest'
}

export class ServerTempsEmbed extends WeatherEmbed {

    constructor(context: HandlerContext, data: Array<[WeatherLinkSchema, GuildMember, OneCallData | WeatherAPIError]>) {
        super(context);
        this.setAuthor(`Temps for ${context.guild!.name}`, context.guild!.iconURL()!);
        this.addField('Location/Person', (
            data.map(([geo, member, onecall]) => {
                if (OpenWeatherAPI.isError(onecall)) return `🏳️‍🌈 <t:${Math.floor(Date.now() / 1000)}:t> ${member}`
                const dateString = `<t:${Math.floor(this.getLocalDate(onecall.timezone_offset).getTime() / 1000)}:t>`;
                return `${Util.localeToEmoji(geo.country)} ${dateString} ${member}`
            }).join('\n')
        ), true);
        this.addField('Temp/Humidity', (
            data.map(([_geo, _member, onecall]) => {
                if (OpenWeatherAPI.isError(onecall)) return `${WeatherEmbed.getWeatherEmoji(context.client, null)} *unknown location*`
                return `${WeatherEmbed.getWeatherEmoji(context.client, onecall.current.weather[0].icon)} ${onecall.current.temp}°C (${Util.toFahrenheit(onecall.current.temp)}°F) ${onecall.current.humidity}%`
            }).join('\n')
        ), true);
    }

    public static orderEmbedData(embed: MessageEmbed, order: ServerTempsEmbedOrder): MessageEmbed {
        const f1Lines = embed.fields[0].value.split('\n');
        const f2Lines = embed.fields[1].value.split('\n');
        const lines = f1Lines.map((line, i) => [line, f2Lines[i]]);

        switch (order) {
            case ServerTempsEmbedOrder.HUMIDITY: {
                lines.sort((l1, l2) => {
                    const l1h = Number(l1[1].match(/(\d+)%$/) ?.[1] || -1000);
                    const l2h = Number(l2[1].match(/(\d+)%$/) ?.[1] || -1000);
                    return l2h - l1h;
                });
                break;
            }
            case ServerTempsEmbedOrder.HOTTEST: {
                lines.sort((l1, l2) => {
                    const l1t = Number(l1[1].match(/(\d+)°C/) ?.[1] || -1000);
                    const l2t = Number(l2[1].match(/(\d+)°C/) ?.[1] || -1000);
                    return l2t - l1t;
                });
                break;
            }
        }
        const newEmbed = new MessageEmbed(embed);
        newEmbed.fields[0].value = lines.map(line => line[0]).join('\n');
        newEmbed.fields[1].value = lines.map(line => line[1]).join('\n');
        return newEmbed;
    }
}
