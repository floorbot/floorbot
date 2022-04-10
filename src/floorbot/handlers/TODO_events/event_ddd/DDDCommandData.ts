import { ApplicationCommandOptionType, ChatInputApplicationCommandData } from 'discord.js';

export const DDDCommandData: ChatInputApplicationCommandData = {
    name: 'ddd',
    description: 'Best month of the year made competitive',
    options: [{
        type: ApplicationCommandOptionType.Subcommand,
        name: 'join',
        description: 'Join DDD and see how you compare!',
        options: [{
            name: 'zone',
            required: true,
            autocomplete: true,
            type: ApplicationCommandOptionType.String,
            description: 'Your IANA timezone (Australia/Sydney). Use the autocomplete to search.'
        }]
    }, {
        type: ApplicationCommandOptionType.Subcommand,
        name: 'leave',
        description: 'Leave the upcoming DDD...'
    }, {
        type: ApplicationCommandOptionType.Subcommand,
        name: 'settings',
        description: '[ADMIN] Open DDD control panel to change/view event settings'
    }, {
        type: ApplicationCommandOptionType.Subcommand,
        name: 'nut',
        description: 'I did a nut 😩',
        options: [{
            name: 'description',
            required: false,
            type: ApplicationCommandOptionType.String,
            description: 'Wanna describe it?'
        }]
    }, {
        type: ApplicationCommandOptionType.Subcommand,
        name: 'leaderboard',
        description: 'See the current DDD leaderboard'
    }]
};
