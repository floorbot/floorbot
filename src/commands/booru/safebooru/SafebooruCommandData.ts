import { ApplicationCommandData, Constants } from 'discord.js';
const { ApplicationCommandOptionTypes } = Constants;

export const SafebooruCommandData: ApplicationCommandData = {
    name: 'safebooru',
    description: 'Search for random safebooru images',
    options: [{
        type: ApplicationCommandOptionTypes.STRING,
        description: 'The tags to search (multiple tags with +)',
        required: false,
        name: 'tags'
    }]
}
