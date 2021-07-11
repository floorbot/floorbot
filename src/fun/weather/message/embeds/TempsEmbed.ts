import { WeatherDatabaseRow } from '../../database/WeatherDatabase';
import { Util, GuildMember, MessageEmbed } from 'discord.js';
import { CurrentData } from '../../api/OpenWeatherAPI';
import { HandlerContext } from 'discord.js-commands';
import { WeatherEmbed } from '../WeatherEmbed';

export interface TempsEmbedData {
    readonly link: WeatherDatabaseRow,
    readonly member: GuildMember,
    readonly current: CurrentData
}

export interface TempsEmbedDataPlus extends TempsEmbedData {
    emoji: string
}

export enum TempsEmbedOrder {
    HUMIDITY = 'humidity',
    HOTTEST = 'hottest'
}

export class TempsEmbed extends WeatherEmbed {

    constructor(context: HandlerContext, data: Array<TempsEmbedDataPlus>) {
        super(context);

        data = data.sort((first: any, second: any) => {
            const firstTemp = first.current ?.main ?.temp || -1000
            const secondTemp = second.current ?.main ?.temp || -1000
            return secondTemp - firstTemp;
        });

        this.setAuthor(`Temps for ${context.guild!.name}`, context.guild!.iconURL()!);
        this.addField('Location/Person', (
            data.map((link) => {
                const dateString = Util.formatDate(this.getLocalDate(link.current.timezone), { showTime: true, showDate: false });
                if (link.current.cod !== 200) return `🏳️‍🌈 (00:00am) ${link.member.displayName}${link.member.user.bot ? '*' : ''}`
                return `${Util.localeToEmoji(link.current.sys.country)} (${dateString}) ${link.member.displayName}${link.member.user.bot ? '*' : ''}`
            }).join('\n')
        ), true)
        this.addField('Temp/Humidity', (
            data.map((link) => {
                if (link.current.cod !== 200) return `${link.emoji} *unknown location*`
                return `${link.emoji} ${link.current.main.temp}°C (${Util.toFahrenheit(link.current.main.temp)}°F) ${link.current.main.humidity}%`
            }).join('\n')
        ), true)
    }

    public static orderEmbedData(embed: MessageEmbed, order: TempsEmbedOrder): MessageEmbed {
        const f1Lines = embed.fields[0].value.split('\n');
        const f2Lines = embed.fields[1].value.split('\n');
        const lines = f1Lines.map((line, i) => [line, f2Lines[i]]);

        switch (order) {
            case TempsEmbedOrder.HUMIDITY: {
                lines.sort((l1, l2) => {
                    const l1h = Number(l1[1].match(/(\d+)%$/) ?.[1] || -1000);
                    const l2h = Number(l2[1].match(/(\d+)%$/) ?.[1] || -1000);
                    return l2h - l1h;
                });
                break;
            }
            case TempsEmbedOrder.HOTTEST: {
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

    public static async generateEmbed(context: HandlerContext, data: Array<TempsEmbedData>) {
        const dataPlus = await Promise.all(data.map(async part => {
            return {
                link: part.link,
                member: part.member,
                current: part.current,
                emoji: await (part.current.cod !== 200 ?
                    WeatherEmbed.getWeatherEmoji(context.client, null) :
                    WeatherEmbed.getWeatherEmoji(context.client, part.current.weather[0].icon)
                )
            }
        }))
        return new TempsEmbed(context, dataPlus);
    }
}
