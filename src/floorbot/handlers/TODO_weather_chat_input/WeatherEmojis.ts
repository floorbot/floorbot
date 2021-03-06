import { Client } from 'discord.js';

export class WeatherEmojis {

    public static getWeatherEmoji(client: Client, icon: string | null): string {
        const cache = client.emojis.cache;
        switch (icon) {
            case '01d': { return (cache.find(emoji => emoji.name == 'weather_01d') || 'âī¸').toString(); }
            case '01n': { return (cache.find(emoji => emoji.name == 'weather_01n') || 'đ').toString(); }
            case '02d': { return (cache.find(emoji => emoji.name == 'weather_02d') || 'đĨī¸').toString(); }
            case '02n': { return (cache.find(emoji => emoji.name == 'weather_02n') || 'đĨī¸').toString(); }
            case '03d': { return (cache.find(emoji => emoji.name == 'weather_03d') || 'âī¸').toString(); }
            case '03n': { return (cache.find(emoji => emoji.name == 'weather_03n') || 'âī¸').toString(); }
            case '04d': { return (cache.find(emoji => emoji.name == 'weather_04d') || 'âī¸').toString(); }
            case '04n': { return (cache.find(emoji => emoji.name == 'weather_04n') || 'âī¸').toString(); }
            case '09d': { return (cache.find(emoji => emoji.name == 'weather_09d') || 'đ§ī¸').toString(); }
            case '09n': { return (cache.find(emoji => emoji.name == 'weather_09n') || 'đ§ī¸').toString(); }
            case '10d': { return (cache.find(emoji => emoji.name == 'weather_10d') || 'đĻī¸').toString(); }
            case '10n': { return (cache.find(emoji => emoji.name == 'weather_10n') || 'đĻī¸').toString(); }
            case '11d': { return (cache.find(emoji => emoji.name == 'weather_11d') || 'đŠī¸').toString(); }
            case '11n': { return (cache.find(emoji => emoji.name == 'weather_11n') || 'đŠī¸').toString(); }
            case '13d': { return (cache.find(emoji => emoji.name == 'weather_13d') || 'âī¸').toString(); }
            case '13n': { return (cache.find(emoji => emoji.name == 'weather_13n') || 'âī¸').toString(); }
            case '50d': { return (cache.find(emoji => emoji.name == 'weather_50d') || 'đ¨').toString(); }
            case '50n': { return (cache.find(emoji => emoji.name == 'weather_50n') || 'đ¨').toString(); }
            default: { return 'đ'; }
        }
    }

    public static getQualityEmoji(client: Client, index: number): string {
        const cache = client.emojis.cache;
        switch (index) {
            case 1: { return (cache.find(emoji => emoji.name == 'weather_air_1') || 'âĒ').toString(); }
            case 2: { return (cache.find(emoji => emoji.name == 'weather_air_2') || 'đĩ').toString(); }
            case 3: { return (cache.find(emoji => emoji.name == 'weather_air_3') || 'đĩ').toString(); }
            case 4: { return (cache.find(emoji => emoji.name == 'weather_air_4') || 'đĸ').toString(); }
            case 5: { return (cache.find(emoji => emoji.name == 'weather_air_5') || 'đĸ').toString(); }
            case 6: { return (cache.find(emoji => emoji.name == 'weather_air_6') || 'đĄ').toString(); }
            case 7: { return (cache.find(emoji => emoji.name == 'weather_air_7') || 'đĄ').toString(); }
            case 8: { return (cache.find(emoji => emoji.name == 'weather_air_8') || 'đ ').toString(); }
            case 9: { return (cache.find(emoji => emoji.name == 'weather_air_9') || 'đ ').toString(); }
            case 10: { return (cache.find(emoji => emoji.name == 'weather_air_10') || 'đ´').toString(); }
            case 11: { return (cache.find(emoji => emoji.name == 'weather_air_11') || 'đ´').toString(); }
            case 12: { return (cache.find(emoji => emoji.name == 'weather_air_12') || 'đ¤').toString(); }
            case 13: { return (cache.find(emoji => emoji.name == 'weather_air_13') || 'đ¤').toString(); }
            default: { return 'â'; }
        }
    }
}
