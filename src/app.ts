import { HandlerClient } from './discord/handler/HandlerClient.js';
import envalid, { num, str } from 'envalid';
import BetterSqlit3 from 'better-sqlite3';
import RedisMock from 'ioredis-mock';
import { Intents } from 'discord.js';
import { PoolConfig } from 'mariadb';
import MariaDB from 'mariadb';
import Redis from 'ioredis';

// Internal tasks
import { PresenceController } from './automations/PresenceController.js';
import { MessageReaction } from './automations/MessageReaction.js';

// Commands
import { OwoifyChatInputHandler } from './commands/fun/owoify/owoify_chat_input/OwoifyChatInputHandler.js';
import { MagickChatInputHandler } from './commands/fun/magick/magick_chat_input/MagickChatInputHandler.js';
import { OwoifyMessageHandler } from './commands/fun/owoify/owoify_message/OwoifyMessageHandler.js';
import { MagickMessageHandler } from './commands/fun/magick/magick_message/MagickMessageHandler.js';
import { FlipChatInputHandler } from './commands/fun/flip/flip_chat_input/FlipChatInputHandler.js';
import { FlipMessageHandler } from './commands/fun/flip/flip_message/FlipMessageHandler.js';
import { AnilistHandler } from './commands/weeb/anilist/AnilistHandler.js';
import { WeatherHandler } from './commands/fun/weather/WeatherHandler.js';
import { DisputeHandler } from './commands/fun/dispute/DisputeHandler.js';
import { DonmaiHandler } from './commands/booru/donmai/DonmaiHandler.js';
import { Rule34Handler } from './commands/booru/rule34/Rule34Handler.js';
import { DefineHandler } from './commands/fun/define/DefineHandler.js';
import { UtilsHandler } from './commands/global/utils/UtilsHandler.js';
import { AdminHandler } from './commands/global/admin/AdminHandler.js';
import { MarkovHandler } from './commands/fun/markov/MarkovHandler.js';
import { DDDHandler } from './commands/events/event_ddd/DDDHandler.js';
import { E621Handler } from './commands/booru/e621/E621Handler.js';
import { LostHandler } from './commands/temp/lost/LostHandler.js';
import { RollHandler } from './commands/fun/roll/RollHandler.js';
import { ClientLogger } from './automations/ClientLogger.js';

const env = envalid.cleanEnv(process.env, {
    DISCORD_TOKEN: str({ desc: 'Discord Token', docs: 'https://discord.com/developers/docs/intro' }),
    DISCORD_OWNERS: str({ default: '', desc: 'Discord IDs separated by space' }),

    REDIS_PORT: num({ default: 0, desc: 'Redis Port' }),
    REDIS_HOST: str({ default: '', desc: 'Redis Host' }),

    DB_HOST: str({ default: '', desc: 'MariaDB Database Host' }),
    DB_NAME: str({ default: '', desc: 'MariaDB Database Name' }),
    DB_USERNAME: str({ default: '', desc: 'MariaDB Database Username' }),
    DB_PASSWORD: str({ default: '', desc: 'MariaDB Database Password' }),
    DB_CONNECTION_LIMIT: num({ default: 0, desc: 'MariaDB Database Connection Limit' }),

    OPEN_WEATHER_API_KEY: str({ desc: 'OpenWeather API Key', docs: 'https://openweathermap.org/api' }),

    DONMAI_USERNAME: str({ default: '', desc: 'Donmai Username', docs: 'https://danbooru.donmai.us/wiki_pages/help:api' }),
    DONMAI_API_KEY: str({ default: '', desc: 'Donmai API Key', docs: 'https://danbooru.donmai.us/wiki_pages/help:api' }),

    E621_USERNAME: str({ default: '', desc: 'E621 Username', docs: 'https://e621.net/help/api' }),
    E621_API_KEY: str({ default: '', desc: 'E621 API Key', docs: 'https://e621.net/help/api' }),
    E621_USER_AGENT: str({ default: '', desc: 'E621 User Agent', docs: 'https://e621.net/help/api' })

});

const poolConfig: PoolConfig = {
    host: env.DB_HOST,
    database: env.DB_NAME,
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    connectionLimit: env.DB_CONNECTION_LIMIT,
    supportBigInt: true
};

if (Object.values(poolConfig).some(val => !val)) console.warn('[env] missing db details, using temporary in-memory database');
const database = Object.values(poolConfig).some(val => !val) ? new BetterSqlit3(':memory:') : MariaDB.createPool(poolConfig);
const redis = env.REDIS_HOST && env.REDIS_PORT ? new Redis(env.REDIS_PORT, env.REDIS_HOST) : new RedisMock();

const client = new HandlerClient({
    intents: Object.values(Intents.FLAGS).reduce((acc, p) => acc | p, 0), // All Intents
    // intents: [Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILDS],
    ownerIds: (env.DISCORD_OWNERS || '').split(' '),
    handlers: [
        new AnilistHandler(redis),
        new AdminHandler(),
        new UtilsHandler(),
        new LostHandler(),
        new DefineHandler(redis),
        new FlipChatInputHandler(),
        new OwoifyChatInputHandler(),
        new FlipMessageHandler(),
        new OwoifyMessageHandler(),
        new DDDHandler(database),
        new MarkovHandler(database),
        new WeatherHandler(database, env.OPEN_WEATHER_API_KEY),
        new RollHandler(),
        new MagickChatInputHandler(),
        new MagickMessageHandler(),
        new DisputeHandler(database),

        // These are good... probably...
        new Rule34Handler(redis)
    ],
    handlerBuilders: [
        (_client: HandlerClient) => {
            const details = { subDomain: 'danbooru', nsfw: true };
            const envAuth = { username: env.DONMAI_USERNAME, apiKey: env.DONMAI_API_KEY }
            const auth = Object.values(envAuth).some(val => !val) ? undefined : envAuth;
            return new DonmaiHandler(details, redis, auth);
        },
        (_client: HandlerClient) => {
            const details = { subDomain: 'safebooru', nsfw: false };
            const envAuth = { username: env.DONMAI_USERNAME, apiKey: env.DONMAI_API_KEY }
            const auth = Object.values(envAuth).some(val => !val) ? undefined : envAuth;
            return new DonmaiHandler(details, redis, auth);
        },
        (_client: HandlerClient) => {
            const envAuth = { username: env.E621_USERNAME, apiKey: env.E621_API_KEY, userAgent: env.E621_USER_AGENT }
            if (Object.values(envAuth).some(val => !val)) console.warn('[env] invalid or missing e621 credentials!');
            return new E621Handler(redis, envAuth);
        }
    ]
});

ClientLogger.setup(client);
client.once('ready', () => { PresenceController.setup(client); })
client.login(env.DISCORD_TOKEN);
MessageReaction(client);
