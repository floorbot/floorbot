import { ApplicationCommandData, Constants } from 'discord.js';
const { ApplicationCommandOptionTypes } = Constants;

export const DefineCommandData: ApplicationCommandData = {
    name: 'define',
    description: 'Define a word yo!',
    options: [{
        type: ApplicationCommandOptionTypes.STRING,
        name: 'query',
        required: false,
        description: 'What does this mean?'
    }]
}
