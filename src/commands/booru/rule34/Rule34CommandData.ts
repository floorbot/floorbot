import { ApplicationCommandData, Constants } from 'discord.js';
const { ApplicationCommandOptionTypes } = Constants;

export const Rule34CommandData: ApplicationCommandData = {
    name: 'rule34',
    description: 'Search for random rule34 images',
    options: [{
        type: ApplicationCommandOptionTypes.STRING,
        description: 'The tags to search (multiple tags with +)',
        autocomplete: true,
        required: false,
        name: 'tags',
    }]
}
