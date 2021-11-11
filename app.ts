import { HandlerClient } from './src/discord/handler/HandlerClient';
import { Intents } from 'discord.js';
import { PoolConfig } from 'mariadb';
import * as MariaDB from 'mariadb';
import * as nconf from 'nconf';

nconf.argv().env().file({ file: './config.json' }).required(['DISCORD_TOKEN']);
nconf.required(['DATABASE:HOST', 'DATABASE:NAME', 'DATABASE:USERNAME', 'DATABASE:PASSWORD', 'DATABASE:CONNECTION_LIMIT']);
nconf.required(['OWNERS']);

// Internal tasks
import { PresenceController } from './src/automations/PresenceController';

// Commands
import { OwoifyChatInputHandler } from './src/commands/fun/owoify/owoify_chat_input/OwoifyChatInputHandler';
import { MagickChatInputHandler } from './src/commands/fun/magick/magick_chat_input/MagickChatInputHandler';
import { OwoifyMessageHandler } from './src/commands/fun/owoify/owoify_message/OwoifyMessageHandler';
import { MagickMessageHandler } from './src/commands/fun/magick/magick_message/MagickMessageHandler';
import { FlipChatInputHandler } from './src/commands/fun/flip/flip_chat_input/FlipChatInputHandler';
import { FlipMessageHandler } from './src/commands/fun/flip/flip_message/FlipMessageHandler';
import { SafebooruHandler } from './src/commands/booru/safebooru/SafebooruHandler';
import { DanbooruHandler } from './src/commands/booru/danbooru/DanbooruHandler';
import { PregchanHandler } from './src/commands/booru/pregchan/PregchanHandler';
import { WeatherHandler } from './src/commands/fun/weather/WeatherHandler';
import { Rule34Handler } from './src/commands/booru/rule34/Rule34Handler';
import { DefineHandler } from './src/commands/fun/define/DefineHandler';
import { UtilsHandler } from './src/commands/global/utils/UtilsHandler';
import { AdminHandler } from './src/commands/global/admin/AdminHandler';
import { MarkovHandler } from './src/commands/fun/markov/MarkovHandler';
import { DDDHandler } from './src/commands/events/event_ddd/DDDHandler';
import { E621Handler } from './src/commands/booru/e621/E621Handler';
import { LostHandler } from './src/commands/temp/lost/LostHandler';
import { RollHandler } from './src/commands/fun/roll/RollHandler';
import { ClientLogger } from './src/automations/ClientLogger';

const poolConfig: PoolConfig = {
    host: nconf.get('DATABASE:HOST'),
    database: nconf.get('DATABASE:NAME'),
    user: nconf.get('DATABASE:USERNAME'),
    password: nconf.get('DATABASE:PASSWORD'),
    connectionLimit: nconf.get('DATABASE:CONNECTION_LIMIT'),
    supportBigInt: true
};

const pool = MariaDB.createPool(poolConfig);

const client = new HandlerClient({
    intents: Object.values(Intents.FLAGS).reduce((acc, p) => acc | p, 0), // All Intents
    // intents: [Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILDS],
    ownerIds: nconf.get('OWNERS'),
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
        new WeatherHandler(pool),
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
client.once('login', () => { PresenceController.setup(client); })
client.login(nconf.get('DISCORD_TOKEN'));
