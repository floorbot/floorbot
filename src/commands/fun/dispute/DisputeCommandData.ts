import { Constants, MessageApplicationCommandData } from 'discord.js';

const { ApplicationCommandTypes } = Constants;

export const DisputeCommandData: MessageApplicationCommandData = {
    name: 'dispute',
    type: ApplicationCommandTypes.MESSAGE
}
