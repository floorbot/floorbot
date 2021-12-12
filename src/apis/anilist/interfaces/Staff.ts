import { CharacterConnection } from './Character';
import { Connection, FuzzyDate } from './Common';
import { MediaConnection } from './Media';
import { User } from './User';

export type StaffConnection = Connection<StaffEdge, Staff>;

export interface Staff {
    readonly id?: number;
    readonly name?: StaffName | null;
    readonly languageV2?: string | null;
    readonly image?: StaffImage | null;
    readonly description?: string | null;
    readonly primaryOccupations?: string[];
    readonly gender?: string | null;
    readonly dateOfBirth?: FuzzyDate;
    readonly dateOfDeath?: FuzzyDate;
    readonly age?: number | null;
    readonly yearsActive?: [number, number | undefined];
    readonly homeTown?: string | null;
    readonly bloodType?: string | null;
    readonly isFavourite: boolean;
    readonly isFavouriteBlocked: boolean;
    readonly siteUrl?: string | null;
    readonly staffMedia?: MediaConnection;
    readonly characters?: CharacterConnection;
    readonly characterMedia?: MediaConnection;
    readonly staff?: Staff;
    readonly submitter?: User;
    readonly submissionStatus?: number | null;
    readonly submissionNotes?: string | null;
    readonly favourites?: number | null;
    readonly modNotes: string | null;
}

export interface StaffName {
    readonly first?: string | null;
    readonly middle?: string | null;
    readonly last?: string | null;
    readonly full?: string | null;
    readonly native?: string | null;
    readonly alternative?: string[];
    readonly userPreferred?: string | null;
}

export interface StaffEdge {
    readonly node?: Staff;
    readonly id?: number | null;
    readonly role?: string | null;
    readonly favouriteOrder?: number | null;
}

export interface StaffImage {
    readonly large?: string | null;
    readonly medium?: string | null;
}

export interface StaffRoleType {
    readonly voiceActor?: Staff | null;
    readonly StaffRoleType?: string | null;
    readonly dubGroup?: string | null;
}
