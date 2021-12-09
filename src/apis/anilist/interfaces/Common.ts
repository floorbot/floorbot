import { Character } from './Character.js';
import { Studio } from './Studio.js';
import { Staff } from './Staff.js';
import { Media } from './Media';

export interface AniListResponse {
    data: {
        Character: Character | null;
        Studio: Studio | null;
        Staff: Staff | null;
        Media: Media | null;
        Page: Page | null;
    };
    errors?: AniListError[];
}

export interface AniListError {
    message: string,
    status: number,
    locations: {
        line: number,
        column: number;
    }[];
}

export interface Page {
    readonly pageInfo?: PageInfo;
    readonly characters?: Character[];
    readonly studios?: Studio[];
    readonly media?: Media[];
    readonly staff?: Staff[];
}

export interface PageInfo {
    readonly total?: number | null;
    readonly perPage?: number | null;
    readonly currentPage?: number | null;
    readonly lastPage?: number | null;
    readonly hasNextPage?: boolean | null;
}

export interface FuzzyDate {
    readonly year?: number | null;
    readonly month?: number | null;
    readonly day?: number | null;
}

export interface Connection<E, N> {
    readonly edges?: E[];
    readonly nodes?: N[];
    readonly pageInfo?: PageInfo;
}
