import consolePrettifier from './lib/console-prettifier.js';
console.error = consolePrettifier(console.error);
console.warn = consolePrettifier(console.warn);
console.log = consolePrettifier(console.log);

import { HandlerClient, HandlerError } from 'discord.js-handlers';
import { IntentsBitField } from 'discord.js';
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
import { AniListChatInputHandler } from './handlers/TODO_anime_handlers/anilist_chat_input/AniListChatInputHandler.js';
import { OwoifyChatInputHandler } from './handlers/TODO_owoify_handlers/owoify_chat_input/OwoifyChatInputHandler.js';
import { MagickChatInputHandler } from './handlers/TODO_magick_handlers/magick_chat_input/MagickChatInputHandler.js';
import { PregchanChatInputHandler } from './handlers/booru/handlers/pregchan_chat_input/PregchanChatInputHandler.js';
import { TraceMoeMessageHandler } from './handlers/TODO_anime_handlers/tracemoe_message/TraceMoeMessageHandler.js';
import { Rule34ChatInputHandler } from './handlers/booru/handlers/rule34_chat_input/Rule34ChatInputHandler.js';
import { DonmaiChatInputHandler } from './handlers/booru/handlers/donmai_chat_input/DonmaiChatInputHandler.js';
import { MagickMessageHandler } from './handlers/TODO_magick_handlers/magick_message/MagickMessageHandler.js';
import { OwoifyMessageHandler } from './handlers/TODO_owoify_handlers/owoify_message/OwoifyMessageHandler.js';
import { FlipChatInputHandler } from './handlers/TODO_flip_handlers/flip_chat_input/FlipChatInputHandler.js';
import { WeatherChatInputHandler } from './handlers/TODO_weather_chat_input/WeatherChatInputHandler.js';
import { E621ChatInputHandler } from './handlers/booru/handlers/e621_chat_input/E621ChatInputHandler.js';
import { FlipMessageHandler } from './handlers/TODO_flip_handlers/flip_message/FlipMessageHandler.js';
import { FloorbotChatInputHandler } from './handlers/floorbot_chat_input/FloorbotChatInputHandler.js';
import { MarkovChatInputHandler } from './handlers/TODO_markov_chat_input/MarkovChatInputHandler.js';
import { DisputeMessageHandler } from './handlers/TODO_dispute_message/DisputeMessageHandler.js';
import { DefineChatInputHandler } from './handlers/define_chat_input/DefineChatInputHandler.js';
import { RollChatInputHandler } from './handlers/TODO_roll_chat_input/RollChatInputHandler.js';
import { SavedChatInputHandler } from './handlers/saved_chat_input/SavedChatInputHandler.js';

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
    // intents: Object.values(GatewayIntentBits).reduce((acc, p) => typeof p === 'number' ? acc | p : acc, 0), // workaround
    intents: IntentsBitField.Flags.Guilds,
    ownerIDs: (env.DISCORD_OWNERS || '').split(' '),
    handlers: [
        new FlipChatInputHandler(),
        new FlipMessageHandler(),

        new FloorbotChatInputHandler(),
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
        new DefineChatInputHandler(redis),
        new SavedChatInputHandler(pool),
        new Rule34ChatInputHandler(pool),
        new PregchanChatInputHandler(pool),
        new E621ChatInputHandler(pool, { username: env.E621_USERNAME, apiKey: env.E621_API_KEY, userAgent: env.E621_USER_AGENT }),
        new DonmaiChatInputHandler(pool, { subDomain: 'danbooru', nsfw: true, auth: { username: env.DONMAI_USERNAME, apiKey: env.DONMAI_API_KEY } }),
        new DonmaiChatInputHandler(pool, { subDomain: 'safebooru', nsfw: false, auth: { username: env.DONMAI_USERNAME, apiKey: env.DONMAI_API_KEY } })
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

client.on('error', (error: Error) => {
    if (error instanceof HandlerError) {
        console.error(`[error] ${error.handler.constructor.name} has run into an error "${error.message}"`);
    } else {
        console.error('[error] An error as occurred', error.message);
    }
});

await client.login(env.DISCORD_TOKEN).then(() => {
    console.log(`[login] All handlers and events setup for <${client.user!.tag}>`);
});
