import { ApplicationCommandData, Constants } from 'discord.js';
const { ApplicationCommandOptionTypes } = Constants;

export const MarkovCommandData: ApplicationCommandData = {
    name: 'markov',
    description: 'Generate messages from channel history',
    options: [{
        name: 'enable',
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        description: '[ADMIN] Enable markov to store messages and post randomly in a channel',
        options: [{
            name: 'channel',
            required: false,
            type: ApplicationCommandOptionTypes.CHANNEL,
            description: 'The channel to enable markov in'
        }]
    }, {
        name: 'disable',
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        description: '[ADMIN] Disable markov from storing message history and posting in a channel',
        options: [{
            name: 'channel',
            required: false,
            type: ApplicationCommandOptionTypes.CHANNEL,
            description: 'The channel to enable markov in'
        }]
    }, {
        name: 'wipe',
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        description: '[ADMIN] Clear all stored message history for a channel',
        options: [{
            name: 'channel',
            required: false,
            type: ApplicationCommandOptionTypes.CHANNEL,
            description: 'The channel to wipe markov history for'
        }]
    }, {
        name: 'frequency',
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        description: '[ADMIN] How frequent should markov try to post a message',
        options: [{
            name: 'ratio',
            required: false,
            type: ApplicationCommandOptionTypes.INTEGER,
            description: 'Channel messages to markov message ratio (default 20)'
        }, {
            name: 'channel',
            required: false,
            type: ApplicationCommandOptionTypes.CHANNEL,
            description: 'The channel to set markov frequency for'
        }]
    }, {
        name: 'generate',
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        description: 'Fore generate a message for this channel',
        options: [{
            name: 'user',
            required: false,
            type: ApplicationCommandOptionTypes.USER,
            description: 'The users data to generate a message from'
        }]
    }]
}
