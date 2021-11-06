import { ChatInputApplicationCommandData, Constants } from 'discord.js';

const { ApplicationCommandOptionTypes, ChannelTypes } = Constants

export const DDDCommandData: ChatInputApplicationCommandData = {
    name: 'ddd',
    description: 'Best month of the year made competitive',
    options: [{
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        name: 'register',
        description: 'Join DDD and see how you compare!',
        options: [{
            name: 'timezone',
            required: true,
            autocomplete: true,
            type: ApplicationCommandOptionTypes.STRING,
            description: 'Your IANA timezone (Australia/Sydney). Use the autocomplete to search.'
        }]
    }, {
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        name: 'settings',
        description: '[ADMIN] Set setting to use for DDD',
        options: [{
            name: 'channel',
            required: false,
            type: ApplicationCommandOptionTypes.CHANNEL,
            description: 'The channel to post DDD updates and info to',
            channelTypes: [ChannelTypes.GUILD_TEXT]
        }, {
            name: 'role',
            required: false,
            type: ApplicationCommandOptionTypes.ROLE,
            description: 'The role each participant should be given'
        }]
    }, {
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        name: 'nut',
        description: 'I did a nut 😩',
        options: [{
            name: 'description',
            required: false,
            type: ApplicationCommandOptionTypes.STRING,
            description: 'Wanna describe it?'
        }]
    }]
}
