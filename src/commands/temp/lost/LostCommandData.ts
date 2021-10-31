import { ApplicationCommandData, Constants } from 'discord.js';

const { ApplicationCommandTypes } = Constants;

export const LostCommandData: ApplicationCommandData = {
    name: 'lost',
    type: ApplicationCommandTypes.CHAT_INPUT,
    description: 'I lost'
}
