import { Constants, MessageApplicationCommandData } from 'discord.js';

const { ApplicationCommandTypes } = Constants;

export const TraceMoeCommandData: MessageApplicationCommandData = {
    name: 'trace moe',
    type: ApplicationCommandTypes.MESSAGE
}
