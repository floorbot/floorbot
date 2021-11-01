import { ApplicationCommandData, Constants } from 'discord.js';

const { ApplicationCommandTypes, ApplicationCommandOptionTypes } = Constants;

export const OwoifyChatInputCommandData: ApplicationCommandData = {
    name: 'owoify',
    description: `owo what's this?`,
    type: ApplicationCommandTypes.CHAT_INPUT,
    options: [{
        type: ApplicationCommandOptionTypes.STRING,
        description: 'owo this',
        required: true,
        name: 'text'
    }]
}
