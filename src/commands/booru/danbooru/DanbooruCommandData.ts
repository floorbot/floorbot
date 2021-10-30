import { ApplicationCommandData, Constants } from 'discord.js';
const { ApplicationCommandOptionTypes } = Constants;

export const DanbooruCommandData: ApplicationCommandData = {
    name: 'danbooru',
    description: 'Search for random danbooru images',
    options: [{
        type: ApplicationCommandOptionTypes.STRING,
        description: 'The tags to search (multiple tags with +)',
        autocomplete: true,
        required: false,
        name: 'tags'
    }]
}
