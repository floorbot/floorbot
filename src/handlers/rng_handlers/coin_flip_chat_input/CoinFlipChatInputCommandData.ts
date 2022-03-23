import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputApplicationCommandData } from 'discord.js';

export const CoinFlipChatInputCommandData: ChatInputApplicationCommandData = {
    name: 'coin_flip',
    type: ApplicationCommandType.ChatInput,
    description: 'Flip a coin',
    options: [{
        type: ApplicationCommandOptionType.Integer,
        description: 'How many coins to flip ',
        required: false,
        name: 'count'
    }]
};
