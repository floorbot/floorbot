(await import('dotenv-safe')).config();

import { HandlerClient } from './discord/handler/HandlerClient.js';
import { Intents } from 'discord.js';
import { PoolConfig } from 'mariadb';
import MariaDB from 'mariadb';

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

const poolConfig: PoolConfig = {
    host: process.env['DB_HOST'],
    database: process.env['DB_NAME'],
    user: process.env['DB_USERNAME'],
    password: process.env['DB_PASSWORD'],
    connectionLimit: parseInt(process.env['DB_CONNECTION_LIMIT'] || '10'),
    supportBigInt: true
};

const pool = MariaDB.createPool(poolConfig);

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
        new DanbooruHandler(),
        new SafebooruHandler(),
        new E621Handler(),
        new PregchanHandler(),
        new Rule34Handler()
    ]
});

ClientLogger.setup(client);
client.once('ready', () => { PresenceController.setup(client); })
client.login(process.env['DISCORD_TOKEN']);
MessageReaction(client);
