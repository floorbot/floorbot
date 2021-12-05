import { ChatInputApplicationCommandData, Constants } from 'discord.js';

const { ApplicationCommandOptionTypes, ApplicationCommandTypes } = Constants;

export enum AniListSubCommand {
    CHARACTER = 'character',
    STAFF = 'staff',
    MEDIA = 'media'
}

export const AniListCommandData: ChatInputApplicationCommandData = {
    name: 'anilist',
    type: ApplicationCommandTypes.CHAT_INPUT,
    description: 'All your AniList needs!',
    options: [{
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        name: AniListSubCommand.MEDIA,
        description: 'Search for an anime or manga!',
        options: [{
            name: 'search',
            required: true,
            description: 'Search for an anime or manga!',
            type: ApplicationCommandOptionTypes.STRING
        }]
    }, {
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        name: AniListSubCommand.CHARACTER,
        description: 'Search for a character!',
        options: [{
            name: 'search',
            required: true,
            description: 'Search for a character!',
            type: ApplicationCommandOptionTypes.STRING
        }]
    }, {
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        name: AniListSubCommand.STAFF,
        description: 'Search for a staff member (voice actors)!',
        options: [{
            name: 'search',
            required: true,
            description: 'Search for a staff member!',
            type: ApplicationCommandOptionTypes.STRING
        }]
    }]
}
