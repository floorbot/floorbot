import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputApplicationCommandData } from 'discord.js';

export enum Rule34SlashCommandStringOptionName {
    Tags = 'tags'
}

export const Rule34ChatInputCommandData: ChatInputApplicationCommandData = {
    name: 'rule34',
    type: ApplicationCommandType.ChatInput,
    description: 'Search for random rule34 images',
    options: [{
        type: ApplicationCommandOptionType.String,
        description: 'The tags to search (multiple tags with +)',
        autocomplete: true,
        required: false,
        name: Rule34SlashCommandStringOptionName.Tags
    }]
};
