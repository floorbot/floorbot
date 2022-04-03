import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputApplicationCommandData } from 'discord.js';

export enum AniListSubCommand {
    CHARACTER = 'character',
    STUDIO = 'studio',
    STAFF = 'staff',
    MEDIA = 'media',
    USER = 'user'
}

export const AniListChatInputCommandData: ChatInputApplicationCommandData = {
    name: 'anilist',
    type: ApplicationCommandType.ChatInput,
    description: 'All your AniList needs!',
    options: [{
        type: ApplicationCommandOptionType.Subcommand,
        name: AniListSubCommand.USER,
        description: 'Search for a user!',
        options: [{
            name: 'search',
            required: true,
            description: 'Search for a user!',
            type: ApplicationCommandOptionType.String
        }]
    }, {
        type: ApplicationCommandOptionType.Subcommand,
        name: AniListSubCommand.MEDIA,
        description: 'Search for an anime or manga!',
        options: [{
            name: 'search',
            required: true,
            description: 'Search for an anime or manga!',
            type: ApplicationCommandOptionType.String
        }]
    }, {
        type: ApplicationCommandOptionType.Subcommand,
        name: AniListSubCommand.CHARACTER,
        description: 'Search for a character!',
        options: [{
            name: 'search',
            required: true,
            description: 'Search for a character!',
            type: ApplicationCommandOptionType.String
        }]
    }, {
        type: ApplicationCommandOptionType.Subcommand,
        name: AniListSubCommand.STAFF,
        description: 'Search for a staff member (voice actors)!',
        options: [{
            name: 'search',
            required: true,
            description: 'Search for a staff member!',
            type: ApplicationCommandOptionType.String
        }]
    }, {
        type: ApplicationCommandOptionType.Subcommand,
        name: AniListSubCommand.STUDIO,
        description: 'Search for a studio!',
        options: [{
            name: 'search',
            required: true,
            description: 'Search for a studio!',
            type: ApplicationCommandOptionType.String
        }]
    }]
};
