import { MediaConnection } from './Media';
import { Connection } from './Common';

export type StudioConnection = Connection<StudioEdge, Studio>;

export interface Studio {
    readonly id: number,
    readonly name: string,
    readonly isAnimationStudio: boolean,
    readonly media?: MediaConnection,
    readonly siteUrl?: string,
    readonly isFavourite: boolean,
    readonly favourites?: number
}

export interface StudioEdge {
    readonly node?: Studio,
    readonly id?: number,
    readonly isMain: boolean,
    readonly favouriteOrder?: number
}
