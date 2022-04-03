import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputApplicationCommandData } from 'discord.js';

export const PregchanChatInputCommandData: ChatInputApplicationCommandData = {
    name: 'pregchan',
    type: ApplicationCommandType.ChatInput,
    description: 'Search for random pregchan images',
    options: [{
        type: ApplicationCommandOptionType.String,
        description: 'The thread (partial) to search',
        required: false,
        name: 'thread',
    }]
};
