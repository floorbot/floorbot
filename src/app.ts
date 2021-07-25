import * as nconf from 'nconf';
nconf.argv().env().file({ file: './config.json' }).required(['DISCORD_TOKEN']);

import { CommandClient } from 'discord.js-commands';
import { Intents } from 'discord.js';

import { LoggerHandler, PresenceHandler, UpdateHandler } from '..';
import { AdminHandler, UtilsHandler } from '..';
import { DanbooruHandler, SafebooruHandler, Rule34Handler, E621Handler, PregchanHandler } from '..';
import { WeatherHandler, DefineHandler, MarkovHandler, MagickHandler, FlipHandler, RollHandler } from '..';

nconf.required(['DATABASE:HOST', 'DATABASE:NAME', 'DATABASE:USERNAME', 'DATABASE:PASSWORD', 'DATABASE:CONNECTION_LIMIT']);

import { PoolConfig } from 'mariadb';
const poolConfig: PoolConfig = {
    host: nconf.get('DATABASE:HOST'),
    database: nconf.get('DATABASE:NAME'),
    user: nconf.get('DATABASE:USERNAME'),
    password: nconf.get('DATABASE:PASSWORD'),
    connectionLimit: nconf.get('DATABASE:CONNECTION_LIMIT'),
    supportBigInt: true
};

const client = new CommandClient({
    intents: Object.values(Intents.FLAGS).reduce((acc, p) => acc | p, 0), // All Intents
    handlers: [
        new LoggerHandler(),
        new PresenceHandler(),
        new UpdateHandler(),

        new AdminHandler(),
        new UtilsHandler(),

        new DanbooruHandler(),
        new SafebooruHandler(),
        new Rule34Handler(),
        new E621Handler(),
        new PregchanHandler(),

        new WeatherHandler(poolConfig),
        new DefineHandler(),
        new MarkovHandler(poolConfig),
        new MagickHandler(),
        new FlipHandler(),
        new RollHandler()
    ]
});

client.login(nconf.get('DISCORD_TOKEN'));
