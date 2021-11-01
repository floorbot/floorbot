import { ApplicationCommandData, Constants } from 'discord.js';

const { ApplicationCommandTypes } = Constants;

export const OwoifyMessageCommandData: ApplicationCommandData = {
    name: 'owoify',
    type: ApplicationCommandTypes.MESSAGE
}
