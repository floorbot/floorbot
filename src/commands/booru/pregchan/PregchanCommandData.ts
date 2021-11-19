import { ChatInputApplicationCommandData, Constants } from 'discord.js';

const { ApplicationCommandTypes, ApplicationCommandOptionTypes } = Constants;

export const PregchanCommandData: ChatInputApplicationCommandData = {
    name: 'pregchan',
    type: ApplicationCommandTypes.CHAT_INPUT,
    description: 'Search for random pregchan images',
    options: [{
        type: ApplicationCommandOptionTypes.STRING,
        description: 'The thread (partial) to search',
        required: false,
        name: 'thread',
    }]
}