import { Character, CharacterConnection, CharacterRole } from './Character';
import { AiringSchedule, AiringScheduleConnection } from './AiringSchedule';
import { Staff, StaffConnection, StaffRoleType } from './Staff';
import { RecommendationConnection } from './Recommendation';
import { MediaTrendConnection } from './MediaTrend';
import { Connection, FuzzyDate } from './Common';
import { StudioConnection } from './Studio';
import { ReviewConnection } from './Review';

export type MediaConnection = Connection<MediaEdge, Media>;

export interface MediaVariables {
    readonly id?: number,
    readonly search?: string,
    readonly type?: MediaType
}

export interface Media {
    readonly id: number,
    readonly idMal?: number,
    readonly title?: MediaTitle,
    readonly type?: MediaType,
    readonly format?: MediaFormat,
    readonly status?: MediaStatus,
    readonly description?: string,
    readonly startDate?: FuzzyDate,
    readonly endDate?: FuzzyDate,
    readonly season?: MediaSeason,
    readonly seasonYear?: number,
    readonly seasonInt?: number,
    readonly episodes?: number,
    readonly duration?: number,
    readonly chapters?: number,
    readonly volumes?: number,
    readonly countryOfOrigin?: string, // ISO 3166-1 alpha-2 country code
    readonly isLicensed?: boolean,
    readonly source?: MediaSource,
    readonly hashtag?: string,
    readonly trailer?: MediaTrailer,
    readonly updatedAt?: number,
    readonly coverImage?: MediaCoverImage,
    readonly bannerImage?: string,
    readonly genres?: string[],
    readonly synonyms?: string[],
    readonly averageScore?: number,
    readonly meanScore?: number,
    readonly popularity?: number,
    readonly isLocked?: boolean,
    readonly trending?: number,
    readonly favourites?: number,
    readonly tags?: string[],
    readonly relations?: MediaConnection,
    readonly characters?: CharacterConnection,
    readonly staff?: StaffConnection,
    readonly studios?: StudioConnection,
    readonly isFavourite: boolean,
    readonly isAdult?: boolean,
    readonly nextAiringEpisode?: AiringSchedule,
    readonly airingSchedule?: AiringScheduleConnection,
    readonly trends?: MediaTrendConnection,
    readonly externalLinks?: MediaExternalLink[],
    readonly streamingEpisodes?: MediaStreamingEpisode[],
    readonly rankings?: MediaRank[],
    readonly mediaListEntry?: MediaList
    readonly reviews?: ReviewConnection,
    readonly recommendations?: RecommendationConnection
    readonly stats?: MediaStats,
    readonly siteUrl?: string,
    readonly autoCreateForumThread?: boolean,
    readonly isRecommendationBlocked?: boolean,
    readonly modNotes?: string
}

export interface MediaEdge {
    readonly node?: Media,
    readonly id?: number,
    readonly relationType?: MediaRelation,
    readonly isMainStudio?: boolean,
    readonly characters?: Character[],
    readonly characterRole?: CharacterRole,
    readonly characterNme?: string,
    readonly roleNotes?: string,
    readonly dubGroup?: string,
    readonly staffRole?: string,
    readonly voiceActors?: Staff[]
    readonly voiceActorRoles?: StaffRoleType[]
    readonly favouriteOrder?: number
}

export enum MediaRelation {
    ADAPTATION = 'ADAPTATION',
    PREQUEL = 'PREQUEL',
    SEQUEL = 'SEQUEL',
    PARENT = 'PARENT',
    SIDE_STORY = 'SIDE_STORY',
    CHARACTER = 'CHARACTER',
    SUMMARY = 'SUMMARY',
    ALTERNATIVE = 'ALTERNATIVE',
    SPIN_OFF = 'SPIN_OFF',
    OTHER = 'OTHER',
    SOURCE = 'SOURCE',
    COMPILATION = 'COMPILATION',
    CONTAINS = 'CONTAINS'
}

export interface MediaTitle {
    readonly romaji?: string
    readonly english?: string
    readonly native?: string,
    readonly userPreferred?: string
}

export enum MediaType {
    ANIME = 'ANIME',
    MANGA = 'MANGA'
}

export enum MediaFormat {
    TV = 'TV',
    TV_SHORT = 'TV_SHORT',
    MOVIE = 'MOVIE',
    SPECIAL = 'SPECIAL',
    OVA = 'OVA',
    ONA = 'ONA',
    MUSIC = 'MUSIC',
    MANGA = 'MANGA',
    NOVEL = 'NOVEL',
    ONE_SHOT = 'ONE_SHOT',
}

export enum MediaStatus {
    FINISHED = 'FINISHED',
    RELEASING = 'RELEASING',
    NOT_YET_RELEASED = 'NOT_YET_RELEASED',
    CANCELLED = 'CANCELLED',
    HIATUS = 'HIATUS'
}

export enum MediaSeason {
    WINTER = 'WINTER',
    SPRING = 'SPRING',
    SUMMER = 'SUMMER',
    FALL = 'FALL',
}

export enum MediaSource {
    ORIGINAL = 'ORIGINAL',
    MANGA = 'MANGA',
    LIGHT_NOVEL = 'LIGHT_NOVEL',
    VISUAL_NOVEL = 'VISUAL_NOVEL',
    VIDEO_GAME = 'VIDEO_GAME',
    OTHER = 'OTHER',
    NOVEL = 'NOVEL',
    DOUJINSHI = 'DOUJINSHI',
    ANIME = 'ANIME',
}

export interface MediaTrailer {
    readonly id?: string,
    readonly site?: 'youtube' | 'dailymotion',
    readonly thumbnail?: string
}

export interface MediaCoverImage {
    readonly extraLarge?: string,
    readonly large?: string,
    readonly medium?: string,
    readonly color?: string,
}

export interface MediaExternalLink {
    readonly id: number
    readonly url: string
    readonly site: string
}

export interface MediaStreamingEpisode {
    readonly title?: string
    readonly thumbnail?: string
    readonly url?: string
    readonly site?: string
}

export interface MediaRank {
    readonly id: number,
    readonly rank: number,
    readonly type: MediaRankType,
    readonly format: MediaFormat,
    readonly year?: number,
    readonly season?: MediaSeason,
    readonly allTime?: boolean,
    readonly context?: string
}

export enum MediaRankType {
    RATED = 'RATED',
    POPULAR = 'POPULAR'
}

export interface MediaStats {
    readonly scoreDistribution?: ScoreDistribution[],
    readonly statusDistribution?: StatusDistribution[]
}

export interface ScoreDistribution {
    readonly score?: number,
    readonly amount?: number
}

export interface StatusDistribution {
    readonly status?: MediaListStatus,
    readonly amount?: number
}

export enum MediaListStatus {
    CURRENT = 'CURRENT',
    PLANNING = 'PLANNING',
    COMPLETED = 'COMPLETED',
    DROPPED = 'DROPPED',
    PAUSED = 'PAUSED',
    REPEATING = 'REPEATING',
}
