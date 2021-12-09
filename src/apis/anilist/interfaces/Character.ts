import { Media, MediaConnection } from './Media';
import { Connection, FuzzyDate } from './Common';
import { Staff, StaffRoleType } from './Staff';

export type CharacterConnection = Connection<CharacterEdge, Character>;

export interface Character {
    readonly id: number;
    readonly name?: CharacterName;
    readonly image?: CharacterImage;
    readonly description?: string | null;
    readonly gender?: string | null;
    readonly dateOfBirth?: FuzzyDate;
    readonly age?: string | null;
    readonly bloodType?: string | null;
    readonly isFavourite: boolean | null;
    readonly isFavouriteBlocked: boolean | null;
    readonly siteUrl?: string | null;
    readonly media?: MediaConnection;
    readonly favourites?: number | null;
    readonly modNotes?: string | null;
}

export interface CharacterEdge {
    readonly node?: Character;
    readonly id?: number;
    readonly role?: CharacterRole;
    readonly name?: string | null;
    readonly voiceActors?: Staff[],
    readonly voiceActorRoles?: StaffRoleType;
    readonly media?: Media[];
    readonly favouriteOrder?: number | null;
}

export interface CharacterName {
    readonly first?: string | null;
    readonly middle?: string | null;
    readonly last?: string | null;
    readonly full?: string | null;
    readonly native?: string | null;
    readonly alternative?: string[];
    readonly alternativeSpoiler?: string[];
    readonly userPreferred?: string | null;
}

export interface CharacterImage {
    readonly large?: string | null;
    readonly medium?: string | null;
}

export enum CharacterRole {
    MAIN = 'MAIN',
    SUPPORTING = 'SUPPORTING',
    BACKGROUND = 'BACKGROUND'
}
