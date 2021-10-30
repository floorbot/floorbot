import './src/discord/Util'; // Must be imported early to add custom functions
import { HandlerClient } from './src/discord/HandlerClient';
import { Intents } from 'discord.js';
import { PoolConfig } from 'mariadb';
import * as MariaDB from 'mariadb';
import * as nconf from 'nconf';

// Internal tasks
import { ClientLogger } from './src/discord/ClientLogger';
import { PresenceController } from './src/automations/PresenceController';

// Commands
import { OwoifyMessageHandler } from './src/commands/fun/owoify_message/OwoifyMessageHandler';
import { FlipMessageHandler } from './src/commands/fun/flip_message/FlipMessageHandler';
import { SafebooruHandler } from './src/commands/booru/safebooru/SafebooruHandler';
import { DanbooruHandler } from './src/commands/booru/danbooru/DanbooruHandler';
import { PregchanHandler } from './src/commands/booru/pregchan/PregchanHandler';
import { Rule34Handler } from './src/commands/booru/rule34/Rule34Handler';
import { DefineHandler } from './src/commands/fun/define/DefineHandler';
import { UtilsHandler } from './src/commands/global/utils/UtilsHandler';
import { AdminHandler } from './src/commands/global/admin/AdminHandler';
import { OwoifyHandler } from './src/commands/fun/owoify/OwoifyHandler';
import { MagickHandler } from './src/commands/fun/magick/MagickHandler';
import { E621Handler } from './src/commands/booru/e621/E621Handler';
import { RollHandler } from './src/commands/fun/roll/RollHandler';
import { FlipHandler } from './src/commands/fun/flip/FlipHandler';
import { MagickMessageHandler } from './src/commands/fun/magick/MagickMessageHandler';
import { MarkovHandler } from './src/commands/fun/markov/MarkovHandler';

nconf.argv().env().file({ file: './config.json' }).required(['DISCORD_TOKEN']);
nconf.required(['DATABASE:HOST', 'DATABASE:NAME', 'DATABASE:USERNAME', 'DATABASE:PASSWORD', 'DATABASE:CONNECTION_LIMIT']);

const poolConfig: PoolConfig = {
    host: nconf.get('DATABASE:HOST'),
    database: nconf.get('DATABASE:NAME'),
    user: nconf.get('DATABASE:USERNAME'),
    password: nconf.get('DATABASE:PASSWORD'),
    connectionLimit: nconf.get('DATABASE:CONNECTION_LIMIT'),
    supportBigInt: true
};

HandlerClient.create({
    intents: Object.values(Intents.FLAGS).reduce((acc, p) => acc | p, 0), // All Intents
    pool: MariaDB.createPool(poolConfig)
}).then(async client => {
    ClientLogger.setup(client);

    client.addHandlers(...[
        new AdminHandler(),
        new UtilsHandler(),

        new MarkovHandler(),
        new DefineHandler(),
        new RollHandler(),
        new FlipHandler(),
        new OwoifyHandler(),
        new MagickHandler(),
        new FlipMessageHandler(),
        new OwoifyMessageHandler(),
        new MagickMessageHandler(),

        new DanbooruHandler(),
        new SafebooruHandler(),
        new E621Handler(),
        new PregchanHandler(),
        new Rule34Handler()
    ]);


    await client.login(nconf.get('DISCORD_TOKEN'));
    PresenceController.setup(client);
})
