import * as nconf from 'nconf';
nconf.argv().env().file({ file: './config.json' }).required(['DISCORD_TOKEN']);

import { BaseHandler, CommandClient } from 'discord.js-commands';
import { Intents, Collection } from 'discord.js';

import { PresenceHandler, LoggerHandler, UpdateHandler } from './index';
import { UtilsHandler, AdminHandler } from './index';
import { WeatherHandler, MarkovHandler, DefineHandler, MagickHandler } from './index';
import { SafebooruHandler, DanbooruHandler, PregchanHandler, Rule34Handler, E621Handler } from './index';

nconf.required(['DATABASE:HOST', 'DATABASE:NAME', 'DATABASE:USERNAME', 'DATABASE:PASSWORD', 'DATABASE:CONNECTION_LIMIT']);
import * as MariaDB from 'mariadb';
const pool = MariaDB.createPool({
    host: nconf.get('DATABASE:HOST'),
    database: nconf.get('DATABASE:NAME'),
    user: nconf.get('DATABASE:USERNAME'),
    password: nconf.get('DATABASE:PASSWORD'),
    connectionLimit: nconf.get('DATABASE:CONNECTION_LIMIT'),
    supportBigInt: true
});

const client = new CommandClient({
    intents: Object.values(Intents.FLAGS).reduce((acc, p) => acc | p, 0), // All Intents
    handlers: new Collection<typeof BaseHandler, any>([
        [PresenceHandler, {}],
        [LoggerHandler, {}],
        [UpdateHandler, {}],

        [UtilsHandler, {}],
        [AdminHandler, {}],

        [WeatherHandler, { pool: pool }],
        [MarkovHandler, { pool: pool }],
        [DefineHandler, {}],
        [MagickHandler, {}],

        [SafebooruHandler, {}],
        [DanbooruHandler, {}],
        [PregchanHandler, {}],
        [Rule34Handler, {}],
        [E621Handler, {}]
    ])
});

client.login(nconf.get('DISCORD_TOKEN'));
