import { OpenWeatherAPI, LocationData, WeatherAPIError, GeocodeData, WeatherLinkSchema, AirPollutionData, OneCallData, WeatherTempsOrder, WeatherHandler } from '../../../..';
import { Util, GuildMember, GuildChannel, MessageEmbed } from 'discord.js';
import { HandlerContext, HandlerEmbed } from 'discord.js-commands';

import { AirPollutionEmbed } from './embeds/AirPollutionEmbed';
import { ServerTempsEmbed } from './embeds/ServerTempsEmbed';
import { ForecastEmbed } from './embeds/ForecastEmbed';
import { CurrentEmbed } from './embeds/CurrentEmbed';
import { AlertEmbed } from './embeds/AlertEmbed';

export class WeatherEmbedFactory {

    public static formatTiemzoneOffset(offset: number): string {
        const now = new Date();
        const time = now.getTime();
        const appOffset = now.getTimezoneOffset();
        const date = new Date(time + (appOffset * 60 * 1000) + (offset * 1000));
        return Util.formatDate(date, { showTime: true, showDate: false, fullName: false });
    }

    public static getUnknownLocationEmbed(handler: WeatherHandler, context: HandlerContext, location: LocationData): HandlerEmbed {
        return handler.getEmbedTemplate(context)
            .setDescription(`Sorry! I could not find \`${OpenWeatherAPI.getLocationString(location, true)}\`\n*Please check the spelling or try another nearby location*`);
    }

    public static getMissingAdminEmbed(handler: WeatherHandler, context: HandlerContext): HandlerEmbed {
        return handler.getEmbedTemplate(context)
            .setDescription(`Sorry! you must be an admin to force link or unlink locations from other people!`);
    }

    public static getMissingParamsEmbed(handler: WeatherHandler, context: HandlerContext, member: GuildMember): HandlerEmbed {
        return handler.getEmbedTemplate(context)
            .setDescription(`Sorry! I do not have a saved location for ${member}. Please use \`/weather link\` to set one!`);
    }

    public static getAPIErrorEmbed(handler: WeatherHandler, context: HandlerContext, error: WeatherAPIError): HandlerEmbed {
        return handler.getEmbedTemplate(context).setDescription([
            `Sorry I seem to have an API issue:`,
            `*${error.message}*`
        ].join('\n'));
    }

    public static getNoLinkedMembersEmbed(handler: WeatherHandler, context: HandlerContext, channel: GuildChannel): HandlerEmbed {
        return handler.getEmbedTemplate(context).setDescription([
            `There are no members with saved locations in ${channel}`,
            'Please use \`/weather link\` to start the weather leaderboard!'
        ].join('\n'));
    }

    public static getLinkedEmbed(handler: WeatherHandler, context: HandlerContext, location: LocationData, member: GuildMember): HandlerEmbed {
        return handler.getEmbedTemplate(context)
            .setDescription(`Succesfully linked location \`${OpenWeatherAPI.getLocationString(location, true)}\` to ${member} 🥳`);
    }

    public static getUnlinkedEmbed(handler: WeatherHandler, context: HandlerContext, member: GuildMember): HandlerEmbed {
        return handler.getEmbedTemplate(context)
            .setDescription(`Succesfully unlinked any saved location from ${member} 🤠`);
    }

    public static getAirPollutionEmbed(handler: WeatherHandler, context: HandlerContext, geocode: GeocodeData | WeatherLinkSchema, airPollution: AirPollutionData): HandlerEmbed {
        return new AirPollutionEmbed(handler, context, geocode, airPollution);
    }

    public static getServerTempsEmbed(handler: WeatherHandler, context: HandlerContext, data: Array<[WeatherLinkSchema, GuildMember, OneCallData | WeatherAPIError]>): HandlerEmbed {
        return new ServerTempsEmbed(handler, context, data);
    }

    public static getForecastEmbed(handler: WeatherHandler, context: HandlerContext, geocode: GeocodeData | WeatherLinkSchema, onecall: OneCallData): HandlerEmbed {
        return new ForecastEmbed(handler, context, geocode, onecall);
    }

    public static getCurrentEmbed(handler: WeatherHandler, context: HandlerContext, geocode: GeocodeData | WeatherLinkSchema, onecall: OneCallData): HandlerEmbed {
        return new CurrentEmbed(handler, context, geocode, onecall);
    }

    public static getAlertEmbed(handler: WeatherHandler, context: HandlerContext, geocode: GeocodeData | WeatherLinkSchema, onecall: OneCallData): HandlerEmbed {
        return new AlertEmbed(handler, context, geocode, onecall);
    }

    public static orderEmbedData(embed: MessageEmbed, order: WeatherTempsOrder): MessageEmbed {
        const f1Lines = embed.fields[0]!.value.split('\n');
        const f2Lines = embed.fields[1]!.value.split('\n');
        const lines = f1Lines.map((line, i) => [line, f2Lines[i]]);

        switch (order) {
            case WeatherTempsOrder.HUMIDITY: {
                lines.sort((l1, l2) => {
                    const l1h = Number(l1[1]!.match(/(\d+)%$/) ?.[1] || -1000);
                    const l2h = Number(l2[1]!.match(/(\d+)%$/) ?.[1] || -1000);
                    return l2h - l1h;
                });
                break;
            }
            case WeatherTempsOrder.HOTTEST: {
                lines.sort((l1, l2) => {
                    const l1t = Number(l1[1]!.match(/(-?\d*\.?\d*)°C/) ?.[1] || -1000);
                    const l2t = Number(l2[1]!.match(/(-?\d*\.?\d*)°C/) ?.[1] || -1000);
                    return l2t - l1t;
                });
                break;
            }
            case WeatherTempsOrder.TIMEZONE: {
                lines.sort((l1, l2) => {
                    const l1Match = l1[0]!.match(/\ (\d+):(\d+)(am|pm)/)!
                    const l1Value = Number(l1Match[1]) + (Number(l1Match[2]) / 100) + (l1Match[3] === 'am' ? 0 : 1000)

                    const l2Match = l2[0]!.match(/\ (\d+):(\d+)(am|pm)/)!
                    const l2Value = Number(l2Match[1]) + (Number(l2Match[2]) / 100) + (l2Match[3] === 'am' ? 0 : 1000)

                    return l1Value - l2Value;
                });
                break;
            }
        }
        embed.fields[0]!.value = lines.map(line => line[0]).join('\n');
        embed.fields[1]!.value = lines.map(line => line[1]).join('\n');
        return embed;
    }
}
