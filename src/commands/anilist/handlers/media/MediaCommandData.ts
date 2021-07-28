import { ApplicationCommandData, Constants } from 'discord.js';
const { ApplicationCommandOptionTypes } = Constants;

export const AnimeCommandData: ApplicationCommandData = {
    name: 'media',
    description: 'Get or search for Anime and Manga on AniList',
    options: [{
        type: ApplicationCommandOptionTypes.STRING,
        description: 'Anime or Manga name or id to search',
        required: true,
        name: 'query'
    }]
}
