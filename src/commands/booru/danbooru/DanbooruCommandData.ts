import { ChatInputApplicationCommandData, Constants } from 'discord.js';

const { ApplicationCommandTypes, ApplicationCommandOptionTypes } = Constants;

export const DanbooruCommandData: ChatInputApplicationCommandData = {
    name: 'danbooru',
    type: ApplicationCommandTypes.CHAT_INPUT,
    description: 'Search for random danbooru images',
    options: [{
        type: ApplicationCommandOptionTypes.STRING,
        description: 'The tags to search (multiple tags with +)',
        autocomplete: true,
        required: false,
        name: 'tags'
    }]
}