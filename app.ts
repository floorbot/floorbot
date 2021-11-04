import './src/discord/Util'; // Must be imported early to add custom functions
import { HandlerClient } from './src/discord/HandlerClient';
import { Intents } from 'discord.js';
import { PoolConfig } from 'mariadb';
import * as MariaDB from 'mariadb';
import * as nconf from 'nconf';

nconf.argv().env().file({ file: './config.json' }).required(['DISCORD_TOKEN']);
nconf.required(['DATABASE:HOST', 'DATABASE:NAME', 'DATABASE:USERNAME', 'DATABASE:PASSWORD', 'DATABASE:CONNECTION_LIMIT']);

// Internal tasks
import { ClientLogger } from './src/discord/ClientLogger';
import { PresenceController } from './src/automations/PresenceController';

// Commands
import { OwoifyChatInputHandler } from './src/commands/fun/owoify/owoify_chat_input/OwoifyChatInputHandler';
import { OwoifyMessageHandler } from './src/commands/fun/owoify/owoify_message/OwoifyMessageHandler';
import { FlipChatInputHandler } from './src/commands/fun/flip/flip_chat_input/FlipChatInputHandler';
import { FlipMessageHandler } from './src/commands/fun/flip/flip_message/FlipMessageHandler';
import { MagickMessageHandler } from './src/commands/fun/magick/MagickMessageHandler';
import { SafebooruHandler } from './src/commands/booru/safebooru/SafebooruHandler';
import { DanbooruHandler } from './src/commands/booru/danbooru/DanbooruHandler';
import { PregchanHandler } from './src/commands/booru/pregchan/PregchanHandler';
import { WeatherHandler } from './src/commands/fun/weather/WeatherHandler';
import { Rule34Handler } from './src/commands/booru/rule34/Rule34Handler';
import { DefineHandler } from './src/commands/fun/define/DefineHandler';
import { UtilsHandler } from './src/commands/global/utils/UtilsHandler';
import { AdminHandler } from './src/commands/global/admin/AdminHandler';
import { MagickHandler } from './src/commands/fun/magick/MagickHandler';
import { MarkovHandler } from './src/commands/fun/markov/MarkovHandler';
import { E621Handler } from './src/commands/booru/e621/E621Handler';
import { LostHandler } from './src/commands/temp/lost/LostHandler';
import { RollHandler } from './src/commands/fun/roll/RollHandler';
import { DDDHandler } from './src/commands/events/ddd/DDDHandler';

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

        new LostHandler(),

        // Start Complete
        new DefineHandler(),
        new FlipChatInputHandler(),
        new OwoifyChatInputHandler(),
        new FlipMessageHandler(),
        new OwoifyMessageHandler(),
        // End Complete

        new DDDHandler(),

        new MarkovHandler(),
        new WeatherHandler(),
        new RollHandler(),
        new MagickHandler(),
        new MagickMessageHandler(),

        new DanbooruHandler(),
        new SafebooruHandler(),
        new E621Handler(),
        new PregchanHandler(),
        new Rule34Handler()
    ]);


    await client.login(nconf.get('DISCORD_TOKEN'));
    PresenceController.setup(client);

    // client.application!.commands.fetch().then(async commands => {
    //     for (const command of commands.values()) {
    //         console.log(command.name)
    //         await command.delete();
    //     }
    // })
    //
    // for (const guild of client.guilds.cache.values()) {
    //     const commands = await guild.commands.fetch();
    //     for (const command of commands.values()) {
    //         console.log(command.name)
    //         await command.delete();
    //     }
    // }

    // client.channels.fetch('661112326694502412').then((channel: any) => {
    //     // return { content: content, ...(channelData.mentions && { allowedMentions: { parse: [] } }) };
    //     const mentions: any = false;
    //     console.log((mentions && { allowedMentions: { parse: [] } }))
    //     channel!.send({ content: 'Sorry not sorry <@256715626951868416>', ...(mentions && { allowedMentions: { parse: [] } }) });
    // })
})
