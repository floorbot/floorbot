import * as nconf from 'nconf';
nconf.argv().env().file({ file: './config.json' }).required(['DISCORD_TOKEN']);

import { CommandClient } from 'discord.js-commands';
import { Intents } from 'discord.js';

import { LoggerHandler } from '..';
import { AdminHandler, UtilsHandler } from '..';
import { DanbooruHandler, SafebooruHandler, Rule34Handler, E621Handler, PregchanHandler } from '..';
// import { DanbooruHandler, E621Handler, PregchanHandler, Rule34Handler, SafebooruHandler } from '..';
// import { WeatherHandler, MagickHandler, DefineHandler, MarkovHandler } from '..';
// import { PresenceHandler, LoggerHandler, UpdateHandler } from './index';sd;lfjds;lkjfdslkhjflksdjf

nconf.required(['DATABASE:HOST', 'DATABASE:NAME', 'DATABASE:USERNAME', 'DATABASE:PASSWORD', 'DATABASE:CONNECTION_LIMIT']);

// import { PoolConfig } from 'mariadb';
// const poolConfig: PoolConfig = {
//     host: nconf.get('DATABASE:HOST'),
//     database: nconf.get('DATABASE:NAME'),
//     user: nconf.get('DATABASE:USERNAME'),
//     password: nconf.get('DATABASE:PASSWORD'),
//     connectionLimit: nconf.get('DATABASE:CONNECTION_LIMIT'),
//     supportBigInt: true
// };

const client = new CommandClient({
    intents: Object.values(Intents.FLAGS).reduce((acc, p) => acc | p, 0), // All Intents
    handlers: [
        new LoggerHandler(),

        new AdminHandler(),
        new UtilsHandler(),

        new DanbooruHandler(),
        new SafebooruHandler(),
        new Rule34Handler(),
        new E621Handler(),
        new PregchanHandler(),
        //
        // new WeatherHandler(poolConfig),
        // new MagickHandler(),
        // new DefineHandler(),
        // new MarkovHandler(poolConfig),
    ]
});

client.login(nconf.get('DISCORD_TOKEN'));
