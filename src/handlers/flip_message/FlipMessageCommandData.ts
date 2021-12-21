import { Constants, MessageApplicationCommandData } from 'discord.js';

const { ApplicationCommandTypes } = Constants;

export const FlipMessageCommandData: MessageApplicationCommandData = {
    name: 'flip',
    type: ApplicationCommandTypes.MESSAGE
};
