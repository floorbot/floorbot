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
    readonly id?: number;
    readonly search?: string;
    readonly type?: MediaType;
}

export interface Media {
    readonly id: number;
    readonly idMal?: number | null;
    readonly title?: MediaTitle;
    readonly type?: MediaType;
    readonly format?: MediaFormat;
    readonly status?: MediaStatus;
    readonly description?: string | null;
    readonly startDate?: FuzzyDate;
    readonly endDate?: FuzzyDate;
    readonly season?: MediaSeason;
    readonly seasonYear?: number | null;
    readonly seasonInt?: number | null;
    readonly episodes?: number | null;
    readonly duration?: number | null;
    readonly chapters?: number | null;
    readonly volumes?: number | null;
    readonly countryOfOrigin?: string | null; // ISO 3166-1 alpha-2 country code
    readonly isLicensed?: boolean | null;
    readonly source?: MediaSource;
    readonly hashtag?: string | null;
    readonly trailer?: MediaTrailer;
    readonly updatedAt?: number | null;
    readonly coverImage?: MediaCoverImage;
    readonly bannerImage?: string | null;
    readonly genres?: string[];
    readonly synonyms?: string[];
    readonly averageScore?: number | null;
    readonly meanScore?: number | null;
    readonly popularity?: number | null;
    readonly isLocked?: boolean;
    readonly trending?: number | null;
    readonly favourites?: number | null;
    readonly tags?: string[];
    readonly relations?: MediaConnection;
    readonly characters?: CharacterConnection;
    readonly staff?: StaffConnection;
    readonly studios?: StudioConnection;
    readonly isFavourite: boolean | null;
    readonly isAdult?: boolean | null;
    readonly nextAiringEpisode?: AiringSchedule;
    readonly airingSchedule?: AiringScheduleConnection;
    readonly trends?: MediaTrendConnection;
    readonly externalLinks?: MediaExternalLink[];
    readonly streamingEpisodes?: MediaStreamingEpisode[];
    readonly rankings?: MediaRank[];
    readonly mediaListEntry?: MediaList;
    readonly reviews?: ReviewConnection;
    readonly recommendations?: RecommendationConnection;
    readonly stats?: MediaStats;
    readonly siteUrl?: string | null;
    readonly autoCreateForumThread?: boolean | null;
    readonly isRecommendationBlocked?: boolean | null;
    readonly modNotes?: string | null;
}

export interface MediaEdge {
    readonly node?: Media;
    readonly id?: number;
    readonly relationType?: MediaRelation;
    readonly isMainStudio?: boolean | null;
    readonly characters?: Character[];
    readonly characterRole?: CharacterRole;
    readonly characterNme?: string | null;
    readonly roleNotes?: string | null;
    readonly dubGroup?: string | null;
    readonly staffRole?: string | null;
    readonly voiceActors?: Staff[];
    readonly voiceActorRoles?: StaffRoleType[];
    readonly favouriteOrder?: number | null;
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
    readonly romaji?: string | null;
    readonly english?: string | null;
    readonly native?: string | null;
    readonly userPreferred?: string | null;
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
    readonly id?: string | null;
    readonly site?: 'youtube' | 'dailymotion' | null;
    readonly thumbnail?: string | null;
}

export interface MediaCoverImage {
    readonly extraLarge?: string | null;
    readonly large?: string | null;
    readonly medium?: string | null;
    readonly color?: string | null;
}

export interface MediaExternalLink {
    readonly id: number;
    readonly url: string;
    readonly site: string;
}

export interface MediaStreamingEpisode {
    readonly title?: string | null;
    readonly thumbnail?: string | null;
    readonly url?: string | null;
    readonly site?: string | null;
}

export interface MediaRank {
    readonly id: number;
    readonly rank: number;
    readonly type: MediaRankType;
    readonly format: MediaFormat;
    readonly year?: number | null;
    readonly season?: MediaSeason;
    readonly allTime?: boolean | null;
    readonly context?: string | null;
}

export enum MediaRankType {
    RATED = 'RATED',
    POPULAR = 'POPULAR'
}

export interface MediaStats {
    readonly scoreDistribution?: ScoreDistribution[];
    readonly statusDistribution?: StatusDistribution[];
}

export interface ScoreDistribution {
    readonly score?: number | null;
    readonly amount?: number | null;
}

export interface StatusDistribution {
    readonly status?: MediaListStatus;
    readonly amount?: number | null;
}

export enum MediaListStatus {
    CURRENT = 'CURRENT',
    PLANNING = 'PLANNING',
    COMPLETED = 'COMPLETED',
    DROPPED = 'DROPPED',
    PAUSED = 'PAUSED',
    REPEATING = 'REPEATING'
}
