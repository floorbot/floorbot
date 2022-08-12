import { EmojiTable } from '../../../helpers/EmojiTable.js';
import { Client } from 'discord.js';

export class WeatherEmojiTable extends EmojiTable {

    public getWeatherEmoji(icon: string | null, client?: Client): string {
        const emoji = this.getEmoji(`weather_${icon}`, client);
        if (emoji) return emoji;
        switch (icon) {
            case '01d': return '☀️'; case '01n': return '🌕';
            case '02d': return '🌥️'; case '02n': return '🌥️';
            case '03d': return '☁️'; case '03n': return '☁️';
            case '04d': return '☁️'; case '04n': return '☁️';
            case '09d': return '🌧️'; case '09n': return '🌧️';
            case '10d': return '🌦️'; case '10n': return '🌦️';
            case '11d': return '🌩️'; case '11n': return '🌩️';
            case '13d': return '❄️'; case '13n': return '❄️';
            case '50d': return '💨'; case '50n': return '💨';
            default: return '🌏';
        }
    }

    public getQualityEmoji(index: number, client?: Client): string {
        const emoji = this.getEmoji(`weather_${index}`, client);
        if (emoji) return emoji;
        switch (index) {
            case 1: return '⚪';
            case 2: return '🔵'; case 3: return '🔵';
            case 4: return '🟢'; case 5: return '🟢';
            case 6: return '🟡'; case 7: return '🟡';
            case 8: return '🟠'; case 9: return '🟠';
            case 10: return '🔴'; case 11: return '🔴';
            case 12: return '🟤'; case 13: return '🟤';
            default: return '❔';
        }
    }
}
