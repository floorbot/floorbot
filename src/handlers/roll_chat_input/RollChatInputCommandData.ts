import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputApplicationCommandData } from 'discord.js';

export const RollChatInputCommandData: ChatInputApplicationCommandData = {
    name: 'roll',
    description: 'Roll some dice',
    type: ApplicationCommandType.ChatInput,
    options: [{
        type: ApplicationCommandOptionType.String,
        description: 'The dice to roll (6d9 or 4d20...)',
        required: false,
        name: 'dice'
    }]
};
