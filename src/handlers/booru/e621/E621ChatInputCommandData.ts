import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputApplicationCommandData } from 'discord.js';

export enum E621SlashCommandStringOptionName {
    Tags = 'tags'
}

export const E621ChatInputCommandData: ChatInputApplicationCommandData = {
    name: 'e621',
    nsfw: true,
    type: ApplicationCommandType.ChatInput,
    description: 'Search for random e621 images',
    options: [{
        type: ApplicationCommandOptionType.String,
        description: 'The tags to search (multiple tags with +)',
        autocomplete: true,
        required: false,
        name: E621SlashCommandStringOptionName.Tags
    }]
};
