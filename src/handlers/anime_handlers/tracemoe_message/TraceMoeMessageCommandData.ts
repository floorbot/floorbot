import { Constants, MessageApplicationCommandData } from 'discord.js';

const { ApplicationCommandTypes } = Constants;

export const TraceMoeMessageCommandData: MessageApplicationCommandData = {
    name: 'trace moe',
    type: ApplicationCommandTypes.MESSAGE
};
