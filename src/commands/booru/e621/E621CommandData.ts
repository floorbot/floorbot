import { ApplicationCommandData, Constants } from 'discord.js';

const { ApplicationCommandTypes, ApplicationCommandOptionTypes } = Constants;

export const E621CommandData: ApplicationCommandData = {
    name: 'e621',
    type: ApplicationCommandTypes.CHAT_INPUT,
    description: 'Search for random e621 images',
    options: [{
        type: ApplicationCommandOptionTypes.STRING,
        description: 'The tags to search (multiple tags with +)',
        autocomplete: true,
        required: false,
        name: 'tags'
    }]
}
