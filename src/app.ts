import { HandlerClient } from './discord/handler/HandlerClient.js';
import envalid, { num, str } from 'envalid';
// import BetterSqlit3 from 'better-sqlite3';
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
import { SafebooruHandler } from './commands/booru/safebooru/SafebooruHandler.js';
import { DanbooruHandler } from './commands/booru/danbooru/DanbooruHandler.js';
import { PregchanHandler } from './commands/booru/pregchan/PregchanHandler.js';
import { WeatherHandler } from './commands/fun/weather/WeatherHandler.js';
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
    REDIS_PORT: num({ default: 0, desc: 'Redis Port' }),
    REDIS_HOST: str({ default: '', desc: 'Redis Host' }),

    DB_HOST: str({ default: '', desc: 'MariaDB Database Host' }),
    DB_NAME: str({ default: '', desc: 'MariaDB Database Name' }),
    DB_USERNAME: str({ default: '', desc: 'MariaDB Database Username' }),
    DB_PASSWORD: str({ default: '', desc: 'MariaDB Database Password' }),
    DB_CONNECTION_LIMIT: num({ default: 0, desc: 'MariaDB Database Connection Limit' }),

    DANBOORU_USERNAME: str({ default: '', desc: 'Danbooru Username', docs: 'https://danbooru.donmai.us/wiki_pages/help:api' }),
    DANBOORU_API_KEY: str({ default: '', desc: 'Danbooru API Key', docs: 'https://danbooru.donmai.us/wiki_pages/help:api' }),

    SAFEBOORU_USERNAME: str({ default: '', desc: 'Safebooru Username', docs: 'https://safebooru.donmai.us/wiki_pages/help:api' }),
    SAFEBOORU_API_KEY: str({ default: '', desc: 'Safebooru API Key', docs: 'https://safebooru.donmai.us/wiki_pages/help:api' })
});

const poolConfig: PoolConfig = {
    host: env.DB_HOST,
    database: env.DB_NAME,
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    connectionLimit: env.DB_CONNECTION_LIMIT,
    supportBigInt: true
};

const pool = MariaDB.createPool(poolConfig);
// const _database = Object.values(poolConfig).some(val => !val) ? new BetterSqlit3(':memory:') : MariaDB.createPool(poolConfig);
const redis = env.REDIS_HOST && env.REDIS_PORT ? new Redis(env.REDIS_PORT, env.REDIS_HOST) : new RedisMock();

const client = new HandlerClient({
    intents: Object.values(Intents.FLAGS).reduce((acc, p) => acc | p, 0), // All Intents
    // intents: [Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILDS],
    ownerIds: (process.env['OWNERS'] || '').split(' '),
    handlers: [
        new AdminHandler(),
        new UtilsHandler(),
        new LostHandler(),
        new DefineHandler(),
        new FlipChatInputHandler(),
        new OwoifyChatInputHandler(),
        new FlipMessageHandler(),
        new OwoifyMessageHandler(),
        new DDDHandler(pool),
        new MarkovHandler(pool),
        new WeatherHandler(pool, process.env['OPEN_WEATHER_API_KEY']!),
        new RollHandler(),
        new MagickChatInputHandler(),
        new MagickMessageHandler(),
        new E621Handler(),
        new PregchanHandler(),
        new Rule34Handler()
    ],
    handlerBuilders: [
        (_client: HandlerClient) => {
            const envAuth = { username: env.DANBOORU_USERNAME, apiKey: env.DANBOORU_API_KEY }
            const auth = Object.values(envAuth).some(val => !val) ? undefined : envAuth;
            return new DanbooruHandler(redis, auth);
        },
        (_client: HandlerClient) => {
            const envAuth = { username: env.SAFEBOORU_USERNAME, apiKey: env.SAFEBOORU_API_KEY }
            const auth = Object.values(envAuth).some(val => !val) ? undefined : envAuth;
            return new SafebooruHandler(redis, auth);
        }
    ]
});

ClientLogger.setup(client);
client.once('ready', () => { PresenceController.setup(client); })
client.login(process.env['DISCORD_TOKEN']);
MessageReaction(client);
