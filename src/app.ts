import './app/builders/booru/BooruActionRowBuilder.js';
import './app/builders/booru/BooruReplyBuilder.js';
import './app/builders/floorbot/FloorbotActionRowBuilder.js';
import './app/builders/floorbot/FloorbotReplyBuilder.js';
import './app/builders/PageableActionRowBuilder.js';
import './discord/builders/AttachmentBuilder.js';
import './discord/builders/EmbedBuilder.js';
import './discord/builders/ModalBuilder.js';

// Pipe console usage to prettifier
import consolePrettifier from './app/console-prettifier.js';
console.error = consolePrettifier(console.error);
console.warn = consolePrettifier(console.warn);
console.log = consolePrettifier(console.log);

import exitHook from 'async-exit-hook';
import { HandlerClient, HandlerError } from 'discord.js-handlers';
import envalid, { num, str } from 'envalid';

// Import All Handlers
import { DefineChatInputHandler } from './floorbot/handlers/define/DefineChatInputHandler.js';
import { FloorbotChatInputHandler } from './floorbot/handlers/floorbot/FloorbotChatInputHandler.js';
import { WeatherChatInputHandler } from './floorbot/handlers/weather/WeatherChatInputHandler.js';

import { PresenceController } from './floorbot/automations/PresenceController.js';

import { IntentsBitField } from 'discord.js';
import Redis from 'ioredis';
import RedisMock from 'ioredis-mock';
import MariaDB, { PoolConfig } from 'mariadb';
import { MessageReaction } from './floorbot/automations/MessageReaction.js';
import { NhentaiCodes } from './floorbot/automations/NhentaiCodes.js';
import { DonmaiChatInputCommandHandler } from './floorbot/handlers/donmai/DonmaiChatInputHandler.js';
import { E621ChatInputCommandHandler } from './floorbot/handlers/e621/E621ChatInputHandler.js';
import { MarkovChatInputCommandHandler } from './floorbot/handlers/markov/MarkovChatInputHandler.js';
import { MarkovMessageCommandHandler } from './floorbot/handlers/markov/MarkovMessageCommandHandler.js';
import { Rule34ChatInputCommandHandler } from './floorbot/handlers/rule34/Rule34ChatInputHandler.js';

const env = envalid.cleanEnv(process.env, {
    DISCORD_TOKEN: str({ desc: 'Discord Token', docs: 'https://discord.com/developers/docs/intro' }),
    DISCORD_OWNERS: str({ default: '', desc: 'Discord IDs separated by space' }),
    DISCORD_FEEDBACK: str({ default: '', desc: 'Discord feedback channel ID' }),

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
    connectionLimit: env.DB_CONNECTION_LIMIT
    // supportBigInt: true
};


let pool = MariaDB.createPool(poolConfig);
const redis = env.REDIS_HOST && env.REDIS_PORT ? new Redis(env.REDIS_PORT, env.REDIS_HOST) : new RedisMock();

const client = new HandlerClient({
    intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMessages, IntentsBitField.Flags.MessageContent],
    ownerIDs: (env.DISCORD_OWNERS || '').split(' '),
    handlers: [
        new FloorbotChatInputHandler(env.DISCORD_FEEDBACK),
        new DefineChatInputHandler(redis),
        new WeatherChatInputHandler({ pool, redis, apiKey: env.OPEN_WEATHER_API_KEY }),
        new E621ChatInputCommandHandler({ redis, apiKey: env.E621_API_KEY, userAgent: env.E621_USER_AGENT, username: env.E621_USERNAME }),
        new DonmaiChatInputCommandHandler({ subDomain: 'safebooru', redis, apiKey: env.DONMAI_API_KEY, username: env.DONMAI_USERNAME }),
        new DonmaiChatInputCommandHandler({ subDomain: 'danbooru', redis, apiKey: env.DONMAI_API_KEY, username: env.DONMAI_USERNAME }),
        new Rule34ChatInputCommandHandler({ redis }),
        new MarkovChatInputCommandHandler({ pool }),
        new MarkovMessageCommandHandler({ pool })
    ]
});

// One time login and exit hook handlers
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

// Handle uncaught or internal errors
client.on('error', error => {
    if (error instanceof HandlerError) { console.error(`[error](${error.handler.constructor.name}) <${error.message}>`, error); }
    else { console.error('[error] An unknown error as occurred', error); }
});

// Log in to discord api
await client.login(env.DISCORD_TOKEN).then(() => {
    console.log(`[login] All handlers and events setup for <${client.user!.tag}>`);
});
