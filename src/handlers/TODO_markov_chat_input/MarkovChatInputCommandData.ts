import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputApplicationCommandData } from 'discord.js';

export const MarkovChatInputCommandData: ChatInputApplicationCommandData = {
    name: 'markov',
    description: 'Generate messages from channel history',
    type: ApplicationCommandType.ChatInput,
    options: [{
        name: 'settings',
        type: ApplicationCommandOptionType.Subcommand,
        description: '[ADMIN] Opens a control panel for markov',
        options: [{
            name: 'channel',
            required: false,
            type: ApplicationCommandOptionType.Channel,
            description: 'The channel the control panel settings are for'
        }]
    }, {
        name: 'frequency',
        type: ApplicationCommandOptionType.Subcommand,
        description: '[ADMIN] How frequent should markov try to post a message',
        options: [{
            name: 'messages',
            required: false,
            type: ApplicationCommandOptionType.Integer,
            description: 'How many channel messages per markov message (default 50)'
        }, {
            name: 'minutes',
            required: false,
            type: ApplicationCommandOptionType.Integer,
            description: 'How many minutes between random markov messages (default 100)'
        }]
    }, {
        name: 'generate',
        type: ApplicationCommandOptionType.Subcommand,
        description: 'Force generate a message for this channel',
        options: [{
            name: 'user',
            required: false,
            type: ApplicationCommandOptionType.User,
            description: 'The users data to generate a message from'
        }]
    }]
};
