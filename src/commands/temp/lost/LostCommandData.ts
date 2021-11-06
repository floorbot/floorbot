import { ChatInputApplicationCommandData, Constants } from 'discord.js';

const { ApplicationCommandTypes } = Constants;

export const LostCommandData: ChatInputApplicationCommandData = {
    name: 'lost',
    type: ApplicationCommandTypes.CHAT_INPUT,
    description: 'I lost'
}
