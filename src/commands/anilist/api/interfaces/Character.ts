import { Media, MediaConnection } from './Media';
import { Connection, FuzzyDate } from './Common';
import { Staff, StaffRoleType } from './Staff';

export type CharacterConnection = Connection<CharacterEdge, Character>;

export interface Character {
    readonly id: number,
    readonly name?: CharacterName,
    readonly image?: CharacterImage,
    readonly description?: string,
    readonly gender?: string,
    readonly dateOfBirth?: FuzzyDate,
    readonly age?: string,
    readonly bloodType?: string,
    readonly isFavourite: boolean,
    readonly isFavouriteBlocked: boolean,
    readonly siteUrl?: string,
    readonly media?: MediaConnection,
    readonly favourites?: number,
    readonly modNotes?: string
}

export interface CharacterEdge {
    readonly node?: Character,
    readonly id?: number,
    readonly role?: CharacterRole,
    readonly name?: string,
    readonly voiceActors?: Staff[],
    readonly voiceActorRoles?: StaffRoleType,
    readonly media?: Media[],
    readonly favouriteOrder?: number
}

export interface CharacterName {
    readonly first?: string
    readonly middle?: string
    readonly last?: string
    readonly full?: string
    readonly native?: string
    readonly alternative?: string[]
    readonly alternativeSpoiler?: string[]
    readonly userPreferred?: string
}

export interface CharacterImage {
    readonly large?: string,
    readonly medium?: string
}

export enum CharacterRole {
    MAIN = 'MAIN',
    SUPPORTING = 'SUPPORTING',
    BACKGROUND = 'BACKGROUND'
}
