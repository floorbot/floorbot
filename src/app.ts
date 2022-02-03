import consolePrettifier from './lib/console-prettifier.js';
console.error = consolePrettifier(console.error);
console.log = consolePrettifier(console.log);

import { HandlerClient } from './lib/discord/HandlerClient.js';
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
import { NhentaiCodes } from './automations/NhentaiCodes.js';
import { BotUpdater } from './automations/BotUpdater.js';

// Commands
import { OwoifyChatInputHandler } from './handlers/owoify_handlers/owoify_chat_input/OwoifyChatInputHandler.js';
import { MagickChatInputHandler } from './commands/fun/magick/magick_chat_input/MagickChatInputHandler.js';
import { OwoifyMessageHandler } from './handlers/owoify_handlers/owoify_message/OwoifyMessageHandler.js';
import { FlipChatInputHandler } from './handlers/flip_handlers/flip_chat_input/FlipChatInputHandler.js';
import { MagickMessageHandler } from './commands/fun/magick/magick_message/MagickMessageHandler.js';
import { WeatherChatInputHandler } from './handlers/TODO_weather_chat_input/WeatherChatInputHandler.js';
import { FlipMessageHandler } from './handlers/flip_handlers/flip_message/FlipMessageHandler.js';
import { DisputeMessageHandler } from './handlers/TODO_dispute_message/DisputeMessageHandler.js';
import { DefineChatInputHandler } from './handlers/define_chat_input/DefineChatInputHandler.js';
import { RollChatInputHandler } from './handlers/roll_chat_input/RollChatInputHandler.js';
import { FloorbotHandler } from './commands/global/floorbot/FloorbotHandler.js';
import { TraceMoeHandler } from './commands/weeb/tracemoe/TraceMoeHandler.js';
import { AniListHandler } from './commands/weeb/anilist/AniListHandler.js';
import { Rule34Handler } from './commands/booru/rule34/Rule34Handler.js';
import { DonmaiHandler } from './commands/booru/donmai/DonmaiHandler.js';
import { MarkovHandler } from './commands/fun/markov/MarkovHandler.js';
import { DDDHandler } from './commands/events/event_ddd/DDDHandler.js';
import { LostHandler } from './commands/events/lost/LostHandler.js';
import { E621Handler } from './commands/booru/e621/E621Handler.js';

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
    E621_USER_AGENT: str({ default: '', desc: 'E621 User Agent', docs: 'https://e621.net/help/api' }),

    IMAGE_MAGICK_PATH: str({ default: '', desc: 'Path to ImageMagick cli' })
});

const poolConfig: PoolConfig = {
    host: env.DB_HOST,
    database: env.DB_NAME,
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    connectionLimit: env.DB_CONNECTION_LIMIT,
    supportBigInt: true
};

let pool = MariaDB.createPool(poolConfig);
if (Object.values(poolConfig).some(val => !val)) console.warn('[env] missing db details, using temporary in-memory database');
const database = Object.values(poolConfig).some(val => !val) ? new BetterSqlit3(':memory:') : pool;
const redis = env.REDIS_HOST && env.REDIS_PORT ? new Redis(env.REDIS_PORT, env.REDIS_HOST) : new RedisMock();

const client = new HandlerClient({
    intents: Object.values(Intents.FLAGS).reduce((acc, p) => acc | p, 0), // All Intents
    // intents: [Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILDS],
    ownerIds: (env.DISCORD_OWNERS || '').split(' '),
    handlers: [
        new FlipChatInputHandler(),
        new FlipMessageHandler(),

        new FloorbotHandler(),
        new AniListHandler(redis),
        new LostHandler(),
        new OwoifyChatInputHandler(),
        new OwoifyMessageHandler(),
        new DDDHandler(database),
        new MarkovHandler(database),
        new WeatherChatInputHandler(pool, env.OPEN_WEATHER_API_KEY),
        new RollChatInputHandler(),
        new MagickChatInputHandler(env.IMAGE_MAGICK_PATH),
        new MagickMessageHandler(),
        new DisputeMessageHandler(pool),
        new TraceMoeHandler(redis),
        new DefineChatInputHandler(),
        new Rule34Handler()
    ],
    handlerBuilders: [
        (_client: HandlerClient) => {
            const envAuth = { username: env.DONMAI_USERNAME, apiKey: env.DONMAI_API_KEY };
            if (Object.values(envAuth).some(val => !val)) console.warn('[env](danbooru) invalid or missing donmai credentials!');
            const auth = Object.values(envAuth).some(val => !val) ? undefined : envAuth;
            const options = { subDomain: 'danbooru', auth: auth, nsfw: true };
            return new DonmaiHandler(options);
        },
        (_client: HandlerClient) => {
            const envAuth = { username: env.DONMAI_USERNAME, apiKey: env.DONMAI_API_KEY };
            if (Object.values(envAuth).some(val => !val)) console.warn('[env](safebooru) invalid or missing donmai credentials!');
            const auth = Object.values(envAuth).some(val => !val) ? undefined : envAuth;
            const options = { subDomain: 'safebooru', auth: auth, nsfw: false };
            return new DonmaiHandler(options);
        },
        (_client: HandlerClient) => {
            const envAuth = { username: env.E621_USERNAME, apiKey: env.E621_API_KEY, userAgent: env.E621_USER_AGENT };
            if (Object.values(envAuth).some(val => !val)) console.warn('[env](e621) invalid or missing e621 credentials!');
            return new E621Handler(envAuth);
        }
    ]
});

client.once('ready', () => {
    PresenceController.setup(client);
    MessageReaction.setup(client);
    BotUpdater.update(client);
    NhentaiCodes.setup(client);
});
client.login(env.DISCORD_TOKEN);
