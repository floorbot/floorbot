import { Constants, MessageApplicationCommandData } from 'discord.js';

const { ApplicationCommandTypes } = Constants;

export const DisputeMessageCommandData: MessageApplicationCommandData = {
    name: 'dispute',
    type: ApplicationCommandTypes.MESSAGE
};
