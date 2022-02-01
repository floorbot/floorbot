import { ChatInputApplicationCommandData, Constants } from 'discord.js';

const { ApplicationCommandOptionTypes, ApplicationCommandTypes } = Constants;

export const RollChatInputCommandData: ChatInputApplicationCommandData = {
    name: 'roll',
    description: 'Roll some dice',
    type: ApplicationCommandTypes.CHAT_INPUT,
    options: [{
        type: ApplicationCommandOptionTypes.STRING,
        description: 'The dice to roll (6d9 or 4d20...)',
        required: false,
        name: 'dice'
    }]
};
