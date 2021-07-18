import { ApplicationCommandData, Constants } from 'discord.js';
const { ApplicationCommandOptionTypes } = Constants;

export const MagickCommandData: ApplicationCommandData = {
    name: 'magick',
    description: 'Get wild with images',
    options: [{
        type: ApplicationCommandOptionTypes.STRING,
        name: 'image',
        required: false,
        description: 'The user, emoji or url to use'
    }]
}
