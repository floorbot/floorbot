import { MessageApplicationCommandData, Constants } from 'discord.js';

const { ApplicationCommandTypes } = Constants;

export const MagickMessageCommandData: MessageApplicationCommandData = {
    name: 'magick',
    type: ApplicationCommandTypes.MESSAGE
}
