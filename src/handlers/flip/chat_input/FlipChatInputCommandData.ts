import { ChatInputApplicationCommandData, Constants } from 'discord.js';

const { ApplicationCommandOptionTypes, ApplicationCommandTypes } = Constants;

export const FlipChatInputCommandData: ChatInputApplicationCommandData = {
    name: 'flip',
    type: ApplicationCommandTypes.CHAT_INPUT,
    description: 'Flip a coin (or text)',
    options: [{
        type: ApplicationCommandOptionTypes.STRING,
        description: 'How many coins (or the text) to flip ',
        required: false,
        name: 'value'
    }]
};
