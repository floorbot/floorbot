import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputApplicationCommandData } from 'discord.js';

export const MagickChatInputCommandData: ChatInputApplicationCommandData = {
    name: 'magick',
    description: 'Get wild with images',
    type: ApplicationCommandType.ChatInput,
    options: [{
        name: 'url',
        description: 'use an image from a url',
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            type: ApplicationCommandOptionType.String,
            name: 'image',
            required: true,
            description: 'The user, emoji or url to use'
        }]
    }, {
        name: 'attachment',
        description: 'use an image from an attachment',
        type: ApplicationCommandOptionType.Subcommand,
        options: [{
            type: ApplicationCommandOptionType.Attachment,
            name: 'attachment',
            required: true,
            description: 'The image file to use'
        }]
    }]
};
