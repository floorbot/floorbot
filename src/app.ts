import consolePrettifier from './lib/console-prettifier.js';
console.error = consolePrettifier(console.error);
console.log = consolePrettifier(console.log);

import { HandlerClient } from 'discord.js-handlers';
import { GatewayIntentBits } from 'discord.js';
import envalid, { num, str } from 'envalid';
import exitHook from 'async-exit-hook';
import RedisMock from 'ioredis-mock';
import { PoolConfig } from 'mariadb';
import MariaDB from 'mariadb';
import Redis from 'ioredis';

// Internal tasks
import { PresenceController } from './automations/PresenceController.js';
import { MessageReaction } from './automations/MessageReaction.js';
import { NhentaiCodes } from './automations/NhentaiCodes.js';

// Commands
import { PregchanChatInputHandler } from './handlers/booru_handlers/pregchan_chat_input/PregchanChatInputHandler.js';
import { AniListChatInputHandler } from './handlers/anime_handlers/anilist_chat_input/AniListChatInputHandler.js';
import { OwoifyChatInputHandler } from './handlers/owoify_handlers/owoify_chat_input/OwoifyChatInputHandler.js';
import { MagickChatInputHandler } from './handlers/magick_handlers/magick_chat_input/MagickChatInputHandler.js';
import { Rule34ChatInputHandler } from './handlers/booru_handlers/rule34_chat_input/Rule34ChatInputHandler.js';
import { DonmaiChatInputHandler } from './handlers/booru_handlers/donmai_chat_input/DonmaiChatInputHandler.js';
import { TraceMoeMessageHandler } from './handlers/anime_handlers/tracemoe_message/TraceMoeMessageHandler.js';
import { MagickMessageHandler } from './handlers/magick_handlers/magick_message/MagickMessageHandler.js';
import { E621ChatInputHandler } from './handlers/booru_handlers/e621_chat_input/E621ChatInputHandler.js';
import { OwoifyMessageHandler } from './handlers/owoify_handlers/owoify_message/OwoifyMessageHandler.js';
import { WeatherChatInputHandler } from './handlers/TODO_weather_chat_input/WeatherChatInputHandler.js';
import { FlipChatInputHandler } from './handlers/flip_handlers/flip_chat_input/FlipChatInputHandler.js';
import { MarkovChatInputHandler } from './handlers/TODO_markov_chat_input/MarkovChatInputHandler.js';
import { FlipMessageHandler } from './handlers/flip_handlers/flip_message/FlipMessageHandler.js';
import { DisputeMessageHandler } from './handlers/TODO_dispute_message/DisputeMessageHandler.js';
import { DefineChatInputHandler } from './handlers/define_chat_input/DefineChatInputHandler.js';
import { RollChatInputHandler } from './handlers/roll_chat_input/RollChatInputHandler.js';

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
const redis = env.REDIS_HOST && env.REDIS_PORT ? new Redis(env.REDIS_PORT, env.REDIS_HOST) : new RedisMock();

// A *temporary* check for env vars
const e621EnvAuth = { username: env.E621_USERNAME, apiKey: env.E621_API_KEY, userAgent: env.E621_USER_AGENT };
if (Object.values(e621EnvAuth).some(val => !val)) console.warn('[env](e621) invalid or missing e621 credentials!');
const donmaiEnvAuth = { username: env.DONMAI_USERNAME, apiKey: env.DONMAI_API_KEY };
if (Object.values(donmaiEnvAuth).some(val => !val)) console.warn('[env](donmai) invalid or missing donmai credentials!');

const client = new HandlerClient({
    // intents: Object.values(GatewayIntentBits).reduce((acc, p) => acc | p, 0), // All Intents
    intents: Object.values(GatewayIntentBits).reduce((acc, p) => typeof p === 'number' ? acc | p : acc, 0), // workaround
    ownerIDs: (env.DISCORD_OWNERS || '').split(' '),
    handlers: [
        new FlipChatInputHandler(),
        new FlipMessageHandler(),

        // new FloorbotHandler(),
        new AniListChatInputHandler(redis),
        new OwoifyChatInputHandler(),
        new OwoifyMessageHandler(),
        new MarkovChatInputHandler(pool),
        new WeatherChatInputHandler(pool, env.OPEN_WEATHER_API_KEY),
        new RollChatInputHandler(),
        new MagickChatInputHandler(env.IMAGE_MAGICK_PATH),
        new MagickMessageHandler(env.IMAGE_MAGICK_PATH),
        new DisputeMessageHandler(pool),
        new TraceMoeMessageHandler(redis),
        new DefineChatInputHandler(),
        new Rule34ChatInputHandler(),
        new PregchanChatInputHandler(),
        new E621ChatInputHandler({ username: env.E621_USERNAME, apiKey: env.E621_API_KEY, userAgent: env.E621_USER_AGENT }),
        new DonmaiChatInputHandler({ subDomain: 'danbooru', nsfw: true, auth: { username: env.DONMAI_USERNAME, apiKey: env.DONMAI_API_KEY } }),
        new DonmaiChatInputHandler({ subDomain: 'safebooru', nsfw: false, auth: { username: env.DONMAI_USERNAME, apiKey: env.DONMAI_API_KEY } })
    ]
});

client.once('ready', () => {
    console.log(`[login] Logged in as <${client.user!.tag}>`);
    PresenceController.setup(client);
    MessageReaction.setup(client);
    NhentaiCodes.setup(client);

    exitHook((done) => {
        console.log(`[exit-hook] Logged out of <${client.user!.tag}>`);
        client.destroy();
        return done();
    });
});

await client.login(env.DISCORD_TOKEN).then(() => {
    console.log(`[login] All handlers and events setup for <${client.user!.tag}>`);
});
