import { ApplicationCommandData, Constants } from 'discord.js';
const { ApplicationCommandOptionTypes } = Constants;

export const PregchanCommandData: ApplicationCommandData = {
    name: 'pregchan',
    description: 'Search for random pregchan images',
    options: [{
        type: ApplicationCommandOptionTypes.STRING,
        description: 'The thread (partial) to search',
        required: false,
        name: 'thread',
    }]
}
