import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputApplicationCommandData } from 'discord.js';

export const FlipChatInputCommandData: ChatInputApplicationCommandData = {
    name: 'flip',
    type: ApplicationCommandType.ChatInput,
    description: 'Flip a coin (or text)',
    options: [{
        type: ApplicationCommandOptionType.String,
        description: 'How many coins (or the text) to flip ',
        required: false,
        name: 'value'
    }]
};
