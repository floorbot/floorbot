import { ChatInputApplicationCommandData, Constants } from 'discord.js';

const { ApplicationCommandTypes, ApplicationCommandOptionTypes } = Constants;

export const Rule34ChatInputCommandData: ChatInputApplicationCommandData = {
    name: 'rule34',
    type: ApplicationCommandTypes.CHAT_INPUT,
    description: 'Search for random rule34 images',
    options: [{
        type: ApplicationCommandOptionTypes.STRING,
        description: 'The tags to search (multiple tags with +)',
        autocomplete: true,
        required: false,
        name: 'tags',
    }]
};
