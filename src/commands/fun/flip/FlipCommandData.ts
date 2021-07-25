import { ApplicationCommandData, Constants } from 'discord.js';
const { ApplicationCommandOptionTypes } = Constants;

export const FlipCommandData: ApplicationCommandData = {
    name: 'flip',
    description: 'Flip a coin (or text)',
    options: [{
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        description: 'Flip a coin',
        name: 'coin',
        options: [{
            type: ApplicationCommandOptionTypes.INTEGER,
            description: 'How many flippers to do (default 1)',
            required: false,
            name: 'count'
        }]
    }, {
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        description: 'Flip a text',
        name: 'text',
        options: [{
            type: ApplicationCommandOptionTypes.STRING,
            description: 'The text to flip',
            required: true,
            name: 'text'
        }]
    }]
}
