import { Client, MessageEmbed, GuildMember, InteractionReplyOptions, GuildChannel } from 'discord.js';
import { LocationData, OpenWeatherAPI, WeatherAPIError } from '../../api/OpenWeatherAPI';
import { HandlerContext } from 'discord.js-commands';

export class WeatherEmbed extends MessageEmbed {

    constructor(context: HandlerContext) {
        super();
        const { member } = (<{ member: GuildMember }>context);
        this.setFooter('Powered by OpenWeatherMap', 'https://openweathermap.org/themes/openweathermap/assets/img/logo_white_cropped.png');
        // this.setAuthor(member.displayName, member.user.displayAvatarURL());
        this.setColor(member.displayColor || 14840969);
    }

    public toReplyOptions(): InteractionReplyOptions {
        return { embeds: [this], components: [] };
    }

    public getLocalDate(timezone: number): Date {
        const now = new Date();
        const time = now.getTime();
        const offset = now.getTimezoneOffset();
        return new Date(time + ((timezone - (Math.abs(offset) * 60)) * 1000));
    }

    public static getUnknownLocationEmbed(context: HandlerContext, location: LocationData): WeatherEmbed {
        return new WeatherEmbed(context)
            .setDescription(`Sorry! I could not find \`${OpenWeatherAPI.getLocationString(location, true)}\`\n*Please check the spelling or try another nearby location*`);
    }

    public static getMissingAdminEmbed(context: HandlerContext): WeatherEmbed {
        return new WeatherEmbed(context)
            .setDescription(`Sorry! you must be an admin to force link or unlink locations from other people!`);
    }

    public static getMissingParamsEmbed(context: HandlerContext, member: GuildMember): WeatherEmbed {
        return new WeatherEmbed(context)
            .setDescription(`Sorry! I do not have a saved location for ${member}. Please use \`/weather link\` to set one!`);
    }

    public static getAPIErrorEmbed(context: HandlerContext, error: WeatherAPIError): WeatherEmbed {
        return new WeatherEmbed(context).setDescription([
            `Sorry I seem to have an API issue:`,
            `*${error.message}*`
        ].join('\n'));
    }

    public static getNoLinkedMembersEmbed(context: HandlerContext, channel: GuildChannel): WeatherEmbed {
        return new WeatherEmbed(context).setDescription([
            `There are no members with saved locations in ${channel}`,
            'Please use \`/weather link\` to start the weather leaderboard!'
        ].join('\n'));
    }

    public static getLinkedEmbed(context: HandlerContext, location: LocationData, member: GuildMember): WeatherEmbed {
        return new WeatherEmbed(context)
            .setDescription(`Succesfully linked location \`${OpenWeatherAPI.getLocationString(location, true)}\` to ${member} 🥳`);
    }

    public static getUnlinkedEmbed(context: HandlerContext, member: GuildMember): WeatherEmbed {
        return new WeatherEmbed(context)
            .setDescription(`Succesfully unlinked any saved location from ${member} 🤠`);
    }



    public static getWeatherEmoji(client: Client, icon: string | null): string {
        const cache = client.emojis.cache;
        switch (icon) {
            case '01d': { return (cache.find(emoji => emoji.name == 'weather_01d') || '☀️').toString() }
            case '01n': { return (cache.find(emoji => emoji.name == 'weather_01n') || '🌕').toString() }
            case '02d': { return (cache.find(emoji => emoji.name == 'weather_02d') || '🌥️').toString() }
            case '02n': { return (cache.find(emoji => emoji.name == 'weather_02n') || '🌥️').toString() }
            case '03d': { return (cache.find(emoji => emoji.name == 'weather_03d') || '☁️').toString() }
            case '03n': { return (cache.find(emoji => emoji.name == 'weather_03n') || '☁️').toString() }
            case '04d': { return (cache.find(emoji => emoji.name == 'weather_04d') || '☁️').toString() }
            case '04n': { return (cache.find(emoji => emoji.name == 'weather_04n') || '☁️').toString() }
            case '09d': { return (cache.find(emoji => emoji.name == 'weather_09d') || '🌧️').toString() }
            case '09n': { return (cache.find(emoji => emoji.name == 'weather_09n') || '🌧️').toString() }
            case '10d': { return (cache.find(emoji => emoji.name == 'weather_10d') || '🌦️').toString() }
            case '10n': { return (cache.find(emoji => emoji.name == 'weather_10n') || '🌦️').toString() }
            case '11d': { return (cache.find(emoji => emoji.name == 'weather_11d') || '🌩️').toString() }
            case '11n': { return (cache.find(emoji => emoji.name == 'weather_11n') || '🌩️').toString() }
            case '13d': { return (cache.find(emoji => emoji.name == 'weather_13d') || '❄️').toString() }
            case '13n': { return (cache.find(emoji => emoji.name == 'weather_13n') || '❄️').toString() }
            case '50d': { return (cache.find(emoji => emoji.name == 'weather_50d') || '💨').toString() }
            case '50n': { return (cache.find(emoji => emoji.name == 'weather_50n') || '💨').toString() }
            default: { return '🌏' }
        }
    }

    public static getQualityEmoji(client: Client, index: number): string {
        const cache = client.emojis.cache;
        switch (index) {
            case 1: { return (cache.find(emoji => emoji.name == 'weather_air_1') || '⚪').toString() }
            case 2: { return (cache.find(emoji => emoji.name == 'weather_air_2') || '🔵').toString() }
            case 3: { return (cache.find(emoji => emoji.name == 'weather_air_3') || '🔵').toString() }
            case 4: { return (cache.find(emoji => emoji.name == 'weather_air_4') || '🟢').toString() }
            case 5: { return (cache.find(emoji => emoji.name == 'weather_air_5') || '🟢').toString() }
            case 6: { return (cache.find(emoji => emoji.name == 'weather_air_6') || '🟡').toString() }
            case 7: { return (cache.find(emoji => emoji.name == 'weather_air_7') || '🟡').toString() }
            case 8: { return (cache.find(emoji => emoji.name == 'weather_air_8') || '🟠').toString() }
            case 9: { return (cache.find(emoji => emoji.name == 'weather_air_9') || '🟠').toString() }
            case 10: { return (cache.find(emoji => emoji.name == 'weather_air_10') || '🔴').toString() }
            case 11: { return (cache.find(emoji => emoji.name == 'weather_air_11') || '🔴').toString() }
            case 12: { return (cache.find(emoji => emoji.name == 'weather_air_12') || '🟤').toString() }
            case 13: { return (cache.find(emoji => emoji.name == 'weather_air_13') || '🟤').toString() }
            default: { return '❔' }
        }
    }
}
