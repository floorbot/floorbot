// Pipe console usage to prettifier
import consolePrettifier from './lib/console-prettifier.js';
console.error = consolePrettifier(console.error);
console.warn = consolePrettifier(console.warn);
console.log = consolePrettifier(console.log);

import { HandlerClient, HandlerError } from 'discord.js-handlers';
// import { GatewayIntentBits } from 'discord.js';
import envalid, { str } from 'envalid';
import exitHook from 'async-exit-hook';

// Import All Handlers
import { FloorbotChatInputHandler } from './handlers/floorbot_chat_input/FloorbotChatInputHandler.js';
import { IntentsBitField } from 'discord.js';

const env = envalid.cleanEnv(process.env, {
    DISCORD_TOKEN: str({ desc: 'Discord Token', docs: 'https://discord.com/developers/docs/intro' }),
    DISCORD_OWNERS: str({ default: '', desc: 'Discord IDs separated by space' }),
    DISCORD_FEEDBACK: str({ default: '', desc: 'Discord feedback channel ID' }),
});

const client = new HandlerClient({
    intents: [IntentsBitField.Flags.Guilds],
    ownerIDs: (env.DISCORD_OWNERS || '').split(' '),
    handlers: [
        new FloorbotChatInputHandler(env.DISCORD_FEEDBACK)
    ]
});

// One time login and exit hook handlers
client.once('ready', () => {
    console.log(`[login] Logged in as <${client.user!.tag}>`);

    exitHook((done) => {
        console.log(`[exit-hook] Logged out of <${client.user!.tag}>`);
        client.destroy();
        return done();
    });
});

// Handle uncaught or internal errors
client.on('error', (error: Error) => {
    if (error instanceof HandlerError) { console.error(`[error] ${error.handler.constructor.name} has run into an error <${error.message}>`); }
    else { console.error('[error] An unknown error as occurred', error.message); }
});

// Log in to discord api
await client.login(env.DISCORD_TOKEN).then(() => {
    console.log(`[login] All handlers and events setup for <${client.user!.tag}>`);
});
