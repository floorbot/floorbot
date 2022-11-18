import { ApplicationCommandType, MessageApplicationCommandData } from 'discord.js';

export const MarkovMessageCommandData: MessageApplicationCommandData = {
    name: 'Markov Forget',
    dmPermission: false,
    type: ApplicationCommandType.Message
};
