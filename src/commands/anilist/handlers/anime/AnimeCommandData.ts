import { ApplicationCommandData, Constants } from 'discord.js';
const { ApplicationCommandOptionTypes } = Constants;

export const AnimeCommandData: ApplicationCommandData = {
    name: 'anime',
    description: 'Get or search for anime on AniList',
    options: [{
        type: ApplicationCommandOptionTypes.STRING,
        description: 'Anime name or id to search',
        required: true,
        name: 'query'
    }]
}
