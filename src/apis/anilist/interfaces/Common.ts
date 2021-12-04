import { Character } from './Character.js';
import { Media } from './Media';

export interface Page {
    readonly pageInfo?: PageInfo,
    readonly characters?: Character[],
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

export interface Connection<E, N> {
    readonly edges?: E[],
    readonly nodes?: N[],
    readonly pageInfo?: PageInfo
}