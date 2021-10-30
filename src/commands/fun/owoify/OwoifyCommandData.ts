import { ApplicationCommandData, Constants } from 'discord.js';
const { ApplicationCommandOptionTypes } = Constants;


export const OwoifyCommandData: ApplicationCommandData = {
    name: 'owoify',
    description: `owo what's this?`,
    options: [{
        type: ApplicationCommandOptionTypes.STRING,
        description: 'owo this',
        required: true,
        name: 'text'
    }]
}
