import { ChatInputApplicationCommandData, Constants } from 'discord.js';

const { ApplicationCommandTypes, ApplicationCommandOptionTypes } = Constants;

export const MagickChatInputCommandData: ChatInputApplicationCommandData = {
    name: 'magick',
    description: 'Get wild with images',
    type: ApplicationCommandTypes.CHAT_INPUT,
    options: [{
        type: ApplicationCommandOptionTypes.STRING,
        name: 'image',
        required: true,
        description: 'The user, emoji or url to use'
    }]
}
