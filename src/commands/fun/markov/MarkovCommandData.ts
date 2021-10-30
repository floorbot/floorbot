import { ApplicationCommandData, Constants } from 'discord.js';
const { ApplicationCommandOptionTypes } = Constants;

export const MarkovCommandData: ApplicationCommandData = {
    name: 'markov',
    description: 'Generate messages from channel history',
    options: [{
        name: 'settings',
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        description: '[ADMIN] Opens a control panel for markov',
        options: [{
            name: 'channel',
            required: false,
            type: ApplicationCommandOptionTypes.CHANNEL,
            description: 'The channel the control panel settings are for'
        }]
    }, {
        name: 'frequency',
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        description: '[ADMIN] How frequent should markov try to post a message',
        options: [{
            name: 'messages',
            required: false,
            type: ApplicationCommandOptionTypes.INTEGER,
            description: 'How many channel messages per markov message (default 20)'
        }, {
            name: 'minutes',
            required: false,
            type: ApplicationCommandOptionTypes.INTEGER,
            description: 'How many minutes between random markov messages (default 60)'
        }]
    }, {
        name: 'generate',
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        description: 'Force generate a message for this channel',
        options: [{
            name: 'user',
            required: false,
            type: ApplicationCommandOptionTypes.USER,
            description: 'The users data to generate a message from'
        }]
    }]
}
