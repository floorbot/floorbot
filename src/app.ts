import './core/builders/AttachmentBuilder.js';
import './core/builders/booru/BooruActionRowBuilder.js';
import './core/builders/booru/BooruReplyBuilder.js';
import './core/builders/EmbedBuilder.js';
import './core/builders/floorbot/FloorbotActionRowBuilder.js';
import './core/builders/floorbot/FloorbotReplyBuilder.js';
import './core/builders/ModalBuilder.js';
import './core/builders/pageable/PageableActionRowBuilder.js';

// Pipe console usage to prettifier
import consolePrettifier from './core/console-prettifier.js';
console.error = consolePrettifier(console.error);
console.warn = consolePrettifier(console.warn);
console.log = consolePrettifier(console.log);

import exitHook from 'async-exit-hook';
import { Events, IntentsBitField } from 'discord.js';
import { HandlerClient, HandlerError } from 'discord.js-handlers';
import envalid, { num, str } from 'envalid';
import Redis from 'ioredis';
import RedisMock from 'ioredis-mock';
import MariaDB from 'mariadb';
import { DonmaiChatInputCommandHandler } from './handlers/booru/donmai/DonmaiChatInputHandler.js';
import { E621ChatInputCommandHandler } from './handlers/booru/e621/E621ChatInputHandler.js';
import { Rule34ChatInputCommandHandler } from './handlers/booru/rule34/Rule34ChatInputHandler.js';
import { DefineChatInputHandler } from './handlers/define/DefineChatInputHandler.js';
import { FloorbotChatInputHandler } from './handlers/floorbot/FloorbotChatInputHandler.js';
import { MarkovChatInputCommandHandler } from './handlers/markov/MarkovChatInputCommandHandler.js';
import { MarkovMessageCommandHandler } from './handlers/markov/MarkovMessageCommandHandler.js';
import { RadioChatInputCommandHandler } from './handlers/radio/RadioChatInputCommandHandler.js';
import { WeatherChatInputHandler } from './handlers/weather/WeatherChatInputHandler.js';
import { MessageReaction } from './tasks/MessageReaction.js';
import { NhentaiCodes } from './tasks/NhentaiCodes.js';
import { PresenceController } from './tasks/PresenceController.js';

const env = envalid.cleanEnv(process.env, {
    DISCORD_TOKEN: str({ desc: 'Discord Token', docs: 'https://discord.com/developers/docs/intro' }),
    DISCORD_OWNERS: str({ desc: 'Discord IDs separated by space' }),
    DISCORD_FEEDBACK: str({ desc: 'Discord feedback channel ID' }),

    REDIS_PORT: num({ default: NaN, desc: 'Redis Port' }),
    REDIS_HOST: str({ default: '', desc: 'Redis Host' }),

    DB_HOST: str({ desc: 'MariaDB Database Host' }),
    DB_NAME: str({ desc: 'MariaDB Database Name' }),
    DB_USERNAME: str({ desc: 'MariaDB Database Username' }),
    DB_PASSWORD: str({ desc: 'MariaDB Database Password' }),
    DB_CONNECTION_LIMIT: num({ desc: 'MariaDB Database Connection Limit' }),

    OPEN_WEATHER_API_KEY: str({ desc: 'OpenWeather API Key', docs: 'https://openweathermap.org/api' }),

    DONMAI_USERNAME: str({ desc: 'Donmai Username', docs: 'https://danbooru.donmai.us/wiki_pages/help:api' }),
    DONMAI_API_KEY: str({ desc: 'Donmai API Key', docs: 'https://danbooru.donmai.us/wiki_pages/help:api' }),

    E621_USERNAME: str({ desc: 'E621 Username', docs: 'https://e621.net/help/api' }),
    E621_API_KEY: str({ desc: 'E621 API Key', docs: 'https://e621.net/help/api' }),
    E621_USER_AGENT: str({ desc: 'E621 User Agent', docs: 'https://e621.net/help/api' })
});

const redis = env.REDIS_HOST && env.REDIS_PORT ? new Redis(env.REDIS_PORT, env.REDIS_HOST) : new RedisMock();
let pool = MariaDB.createPool({
    host: env.DB_HOST,
    database: env.DB_NAME,
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    connectionLimit: env.DB_CONNECTION_LIMIT
    // supportBigInt: true
});

const client = new HandlerClient({
    intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMessages, IntentsBitField.Flags.MessageContent, IntentsBitField.Flags.GuildVoiceStates],
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
        new MarkovMessageCommandHandler({ pool }),
        new RadioChatInputCommandHandler()
    ]
});

// One time login and exit hook handlers
client.once(Events.ClientReady, () => {
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
client.on(Events.Error, error => {
    if (error instanceof HandlerError) { console.error(`[error](${error.handler.constructor.name}) <${error.message}>`, error); }
    else { console.error('[error] An unknown error as occurred', error); }
});

// Log in to discord api
await client.login(env.DISCORD_TOKEN).then(() => {
    console.log(`[login] All handlers and events setup for <${client.user!.tag}>`);
});
