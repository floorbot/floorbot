import { ApplicationCommandData, Constants } from 'discord.js';
const { ApplicationCommandOptionTypes } = Constants;

export const RollCommandData: ApplicationCommandData = {
    name: 'roll',
    description: 'Roll dice (up to 25 types)',
    options: [{
        type: ApplicationCommandOptionTypes.STRING,
        description: 'The dice to roll (6d9 or 4d20...)',
        required: false,
        name: 'dice'
    }]
}
