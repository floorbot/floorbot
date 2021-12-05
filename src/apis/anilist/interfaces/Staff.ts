import { CharacterConnection } from './Character';
import { Connection, FuzzyDate } from './Common';
import { MediaConnection } from './Media';
import { User } from './User';

export type StaffConnection = Connection<StaffEdge, Staff>;

export interface Staff {
    readonly id: number,
    readonly name?: StaffName,
    readonly languageV2?: string,
    readonly image?: StaffImage,
    readonly description?: string,
    readonly primaryOccupations?: string[],
    readonly gender?: string,
    readonly dateOfBirth?: FuzzyDate,
    readonly dateOfDeath?: FuzzyDate,
    readonly age?: number,
    readonly yearsActive?: [number, number | undefined],
    readonly homeTown?: string,
    readonly bloodType?: string,
    readonly isFavourite: boolean,
    readonly isFavouriteBlocked: boolean,
    readonly siteUrl?: string,
    readonly staffMedia?: MediaConnection,
    readonly characters?: CharacterConnection,
    readonly characterMedia?: MediaConnection,
    readonly staff?: Staff,
    readonly submitter?: User,
    readonly submissionStatus?: number,
    readonly submissionNotes?: string,
    readonly favourites?: number,
    readonly modNotes: string
}

export interface StaffName {
    readonly first?: string,
    readonly middle?: string,
    readonly last?: string,
    readonly full?: string,
    readonly native?: string,
    readonly alternative?: string[],
    readonly userPreferred?: string
}

export interface StaffEdge {
    readonly node?: Staff,
    readonly id?: number,
    readonly role?: string,
    readonly favouriteOrder?: number
}

export interface StaffImage {
    readonly large?: string,
    readonly medium?: string
}

export interface StaffRoleType {
    readonly voiceActor?: Staff
    readonly StaffRoleType?: string,
    readonly dubGroup?: string
}
