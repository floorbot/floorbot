import { MediaConnection } from './Media';
import { PageInfo } from './Common';

export interface Studio {
    readonly id: number,
    readonly name: string,
    readonly isAnimationStudio: boolean,
    readonly media?: MediaConnection,
    readonly siteUrl?: string,
    readonly isFavourite: boolean,
    readonly favourites?: number
}

export interface StudioConnection {
    readonly edges?: StudioEdge[],
    readonly nodes?: Studio[],
    readonly pageInfo?: PageInfo
}

export interface StudioEdge {
    readonly node?: Studio,
    readonly id?: number,
    readonly isMain: boolean,
    readonly favouriteOrder?: number
}
