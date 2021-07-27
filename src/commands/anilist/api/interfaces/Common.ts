import { Media } from './Media';

export interface Page {
    readonly pageInfo: PageInfo,
    readonly media?: Media[]
}

export interface PageInfo {
    readonly total?: number,
    readonly perPage?: number,
    readonly currentPage?: number,
    readonly lastPage?: number,
    readonly hasNextPage?: boolean
}

export interface FuzzyDate {
    readonly year?: number,
    readonly month?: number,
    readonly day?: number
}
