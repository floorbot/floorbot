import { ChatInputApplicationCommandData, Constants } from 'discord.js';

const { ApplicationCommandOptionTypes, ApplicationCommandTypes } = Constants;

export const RollCommandData: ChatInputApplicationCommandData = {
    name: 'roll',
    description: 'Roll dice (up to 25 types)',
    type: ApplicationCommandTypes.CHAT_INPUT,
    options: [{
        type: ApplicationCommandOptionTypes.STRING,
        description: 'The dice to roll (6d9 or 4d20...)',
        required: false,
        name: 'dice'
    }]
}
