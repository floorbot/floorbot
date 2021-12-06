import consolePrettifier from './lib/ConsolePrettifier.js';
console.error = consolePrettifier(console.error);
console.log = consolePrettifier(console.log);

import { HandlerClient } from './discord/HandlerClient.js';
import envalid, { num, str } from 'envalid';
import BetterSqlit3 from 'better-sqlite3';
// import RedisMock from 'ioredis-mock';
import { Intents } from 'discord.js';
import { PoolConfig } from 'mariadb';
import MariaDB from 'mariadb';
// import Redis from 'ioredis';

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
import { TraceMoeHandler } from './commands/fun/tracemoe/TraceMoeHandler.js';
import { WeatherHandler } from './commands/fun/weather/WeatherHandler.js';
import { Rule34Handler } from './commands/booru/rule34/Rule34Handler.js';
import { DisputeHandler } from './commands/fun/dispute/DisputeHandler.js';
import { DonmaiHandler } from './commands/booru/donmai/DonmaiHandler.js';
import { DefineHandler } from './commands/fun/define/DefineHandler.js';
import { UtilsHandler } from './commands/global/utils/UtilsHandler.js';
import { AdminHandler } from './commands/global/admin/AdminHandler.js';
import { MarkovHandler } from './commands/fun/markov/MarkovHandler.js';
import { DDDHandler } from './commands/events/event_ddd/DDDHandler.js';
import { LostHandler } from './commands/events/lost/LostHandler.js';
import { E621Handler } from './commands/booru/e621/E621Handler.js';
import { RollHandler } from './commands/fun/roll/RollHandler.js';

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

if (Object.values(poolConfig).some(val => !val)) console.warn('[env] missing db details, using temporary in-memory database');
const database = Object.values(poolConfig).some(val => !val) ? new BetterSqlit3(':memory:') : MariaDB.createPool(poolConfig);
// const redis = env.REDIS_HOST && env.REDIS_PORT ? new Redis(env.REDIS_PORT, env.REDIS_HOST) : new RedisMock();

const client = new HandlerClient({
    intents: Object.values(Intents.FLAGS).reduce((acc, p) => acc | p, 0), // All Intents
    // intents: [Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILDS],
    ownerIds: (env.DISCORD_OWNERS || '').split(' '),
    handlers: [
        new AdminHandler(),
        new UtilsHandler(),
        new LostHandler(),
        new FlipChatInputHandler(),
        new OwoifyChatInputHandler(),
        new FlipMessageHandler(),
        new OwoifyMessageHandler(),
        new DDDHandler(database),
        new MarkovHandler(database),
        new WeatherHandler(database, env.OPEN_WEATHER_API_KEY),
        new RollHandler(),
        new MagickChatInputHandler(env['IMAGE_MAGICK_PATH']),
        new MagickMessageHandler(),
        new DisputeHandler(database),
        new TraceMoeHandler(),

        new DefineHandler(),
        new Rule34Handler()
    ],
    handlerBuilders: [
        (_client: HandlerClient) => {
            const envAuth = { username: env.DONMAI_USERNAME, apiKey: env.DONMAI_API_KEY }
            if (Object.values(envAuth).some(val => !val)) console.warn('[env](danbooru) invalid or missing donmai credentials!');
            const auth = Object.values(envAuth).some(val => !val) ? undefined : envAuth;
            const options = { subDomain: 'danbooru', auth: auth, nsfw: true };
            return new DonmaiHandler(options);
        },
        (_client: HandlerClient) => {
            const envAuth = { username: env.DONMAI_USERNAME, apiKey: env.DONMAI_API_KEY }
            if (Object.values(envAuth).some(val => !val)) console.warn('[env](safebooru) invalid or missing donmai credentials!');
            const auth = Object.values(envAuth).some(val => !val) ? undefined : envAuth;
            const options = { subDomain: 'safebooru', auth: auth, nsfw: false };
            return new DonmaiHandler(options);
        },
        (_client: HandlerClient) => {
            const envAuth = { username: env.E621_USERNAME, apiKey: env.E621_API_KEY, userAgent: env.E621_USER_AGENT }
            if (Object.values(envAuth).some(val => !val)) console.warn('[env](e621) invalid or missing e621 credentials!');
            return new E621Handler(envAuth);
        }
    ]
});

client.once('ready', () => {
    PresenceController.setup(client);
    MessageReaction.setup(client);
})
client.login(env.DISCORD_TOKEN);
