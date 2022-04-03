import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputApplicationCommandData } from 'discord.js';

export const MagickChatInputCommandData: ChatInputApplicationCommandData = {
    name: 'magick',
    description: 'Get wild with images',
    type: ApplicationCommandType.ChatInput,
    options: [{
        type: ApplicationCommandOptionType.String,
        name: 'image',
        required: true,
        description: 'The user, emoji or url to use'
    }]
};
