import { Constants, MessageApplicationCommandData } from 'discord.js';

const { ApplicationCommandTypes } = Constants;

export const OwoifyMessageCommandData: MessageApplicationCommandData = {
    name: 'owoify',
    type: ApplicationCommandTypes.MESSAGE
};
