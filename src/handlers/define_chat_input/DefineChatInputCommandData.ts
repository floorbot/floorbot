import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputApplicationCommandData } from 'discord.js';

export const DefineChatInputCommandData: ChatInputApplicationCommandData = {
    name: 'define',
    type: ApplicationCommandType.ChatInput,
    description: 'Define a word yo!',
    options: [{
        type: ApplicationCommandOptionType.String,
        name: 'query',
        required: false,
        autocomplete: true,
        description: 'What does this mean?'
    }]
};
