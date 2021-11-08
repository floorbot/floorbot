import { ChatInputApplicationCommandData, Constants } from 'discord.js';

const { ApplicationCommandOptionTypes } = Constants

export const DDDCommandData: ChatInputApplicationCommandData = {
    name: 'ddd',
    description: 'Best month of the year made competitive',
    options: [{
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        name: 'join',
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
        name: 'leave',
        description: 'Leave the upcoming DDD...'
    }, {
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        name: 'settings',
        description: '[ADMIN] Open DDD control panel to change/view event settings'
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
