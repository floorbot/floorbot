import { OpenWeatherAPILimiter } from './open_weather/OpenWeatherAPILimiter.js';
import { WeatherCommandData } from './WeatherChatInputCommandData.js';
import { OpenWeatherAPI } from './open_weather/OpenWeatherAPI.js';
import { WeatherLinkTable } from './tables/WeatherLinkTable.js';
import { ChatInputCommandHandler } from 'discord.js-handlers';
import { CommandInteraction } from 'discord.js';
import { Redis } from 'ioredis';
import { Pool } from 'mariadb';

export class WeatherChatInputHandler extends ChatInputCommandHandler {

    private readonly database: WeatherLinkTable;
    private readonly openweather: OpenWeatherAPI;

    constructor({ pool, apiKey, redis }: { pool: Pool, apiKey: string, redis: Redis; }) {
        super(WeatherCommandData);
        const limiter = new OpenWeatherAPILimiter(apiKey, {}, redis);
        this.openweather = new OpenWeatherAPI({ apiKey: apiKey, limiter: limiter });
        this.database = new WeatherLinkTable(pool);
    }

    public run(command: CommandInteraction): Promise<any> {
        throw new Error('Method not implemented.');
    }
}
