import { ChatInputApplicationCommandData, Constants } from 'discord.js';

const { ApplicationCommandOptionTypes, ApplicationCommandTypes } = Constants;

export const DefineCommandData: ChatInputApplicationCommandData = {
    name: 'define',
    type: ApplicationCommandTypes.CHAT_INPUT,
    description: 'Define a word yo!',
    options: [{
        type: ApplicationCommandOptionTypes.STRING,
        name: 'query',
        required: false,
        autocomplete: true,
        description: 'What does this mean?'
    }]
}
