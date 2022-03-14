import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputApplicationCommandData } from 'discord.js';

export const OwoifyChatInputCommandData: ChatInputApplicationCommandData = {
    name: 'owoify',
    description: `owo what's this?`,
    type: ApplicationCommandType.ChatInput,
    options: [{
        type: ApplicationCommandOptionType.String,
        description: 'owo this',
        required: true,
        name: 'text'
    }]
};
