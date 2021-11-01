import { ApplicationCommandData, Constants } from 'discord.js';

const { ApplicationCommandTypes } = Constants;

export const FlipMessageCommandData: ApplicationCommandData = {
    name: 'flip',
    type: ApplicationCommandTypes.MESSAGE
}
