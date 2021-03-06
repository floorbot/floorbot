import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputApplicationCommandData } from 'discord.js';

export const E621ChatInputCommandData: ChatInputApplicationCommandData = {
    name: 'e621',
    type: ApplicationCommandType.ChatInput,
    description: 'Search for random e621 images',
    options: [{
        type: ApplicationCommandOptionType.String,
        description: 'The tags to search (multiple tags with +)',
        autocomplete: true,
        required: false,
        name: 'tags'
    }]
};
