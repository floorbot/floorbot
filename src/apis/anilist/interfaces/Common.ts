import { Page, PageInfo } from './Page.js';
import { Character } from './Character.js';
import { Studio } from './Studio.js';
import { Staff } from './Staff.js';
import { User } from './User.js';
import { Media } from './Media';

export interface AniListResponse {
    readonly data: {
        readonly Character: Character | null;
        readonly Studio: Studio | null;
        readonly Staff: Staff | null;
        readonly Media: Media | null;
        readonly User: User | null;
        readonly Page: Page | null;
    };
    readonly errors?: AniListError[];
}

export interface AniListError {
    readonly message: string,
    readonly status: number,
    readonly locations: {
        readonly line: number,
        readonly column: number;
    }[];
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
