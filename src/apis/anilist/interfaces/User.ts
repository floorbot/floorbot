import { MediaConnection, MediaFormat, MediaListStatus, MediaTag } from "./Media.js";
import { NotificationOption } from "./Notification.js";
import { Studio, StudioConnection } from "./Studio.js";
import { CharacterConnection } from "./Character.js";
import { Staff, StaffConnection } from "./Staff.js";

export interface User {
    readonly id: number;
    readonly name: string;
    readonly about?: string | null;
    readonly avatar?: UserAvatar;
    readonly bannerImage?: string | null;
    readonly isFollowing?: boolean | null;
    readonly isFollower?: boolean | null;
    readonly isBlocked?: boolean | null;
    readonly bans?: any;
    readonly options?: UserOptions;
    readonly mediaListOptions?: MediaListOptions;
    readonly favourites?: Favourites;
    readonly statistics?: UserStatisticTypes;
    readonly unreadNotificationCount?: number | null;
    readonly siteUrl?: string | null;
    readonly donatorTier?: number | null;
    readonly donatorBadge?: string | null;
    readonly moderatorRoles?: ModRole[];
    readonly createdAt?: number | null;
    readonly updatedAt?: number | null;
    readonly previousNames?: UserPreviousName[];
}

export interface UserAvatar {
    readonly large?: string | null;
    readonly medium?: string | null;
}

export interface UserOptions {
    readonly titleLanguage?: UserTitleLanguage;
    readonly displayAdultContent?: boolean | null;
    readonly airingNotifications?: boolean | null;
    readonly profileColor?: string | null;
    readonly notificationOptions?: NotificationOption[];
    readonly timezone?: string | null;
    readonly activityMergeTime?: number | null;
    readonly staffNameLanguage?: UserStaffNameLanguage;
}

export enum UserTitleLanguage {
    ROMAJI = 'ROMAJI',
    ENGLISH = 'ENGLISH',
    NATIVE = 'NATIVE',
    ROMAJI_STYLISED = 'ROMAJI_STYLISED',
    ENGLISH_STYLISED = 'ENGLISH_STYLISED',
    NATIVE_STYLISED = 'NATIVE_STYLISED'
}

export enum UserStaffNameLanguage {
    ROMAJI_WESTERN = 'ROMAJI_WESTERN',
    ROMAJI = 'ROMAJI',
    NATIVE = 'NATIVE'
}

export interface MediaListOptions {
    readonly scoreFormat?: ScoreFormat;
    readonly rowOrder?: string | null;
    readonly animeList?: MediaListTypeOptions;
    readonly mangaList?: MediaListTypeOptions;
}

export enum ScoreFormat {
    POINT_100 = 'POINT_100',
    POINT_10_DECIMAL = 'POINT_10_DECIMAL',
    POINT_10 = 'POINT_10',
    POINT_5 = 'POINT_5',
    POINT_3 = 'POINT_3'
}

export interface MediaListTypeOptions {
    readonly sectionOrder?: string[];
    readonly splitCompletedSectionByFormat?: boolean | null;
    readonly customLists?: string[];
    readonly advancedScoring?: string[];
    readonly advancedScoringEnabled?: boolean | null;
}

export interface Favourites {
    readonly anime?: MediaConnection;
    readonly manga?: MediaConnection;
    readonly characters?: CharacterConnection;
    readonly staff?: StaffConnection;
    readonly studios?: StudioConnection;
}

export interface UserStatisticTypes {
    readonly anime?: UserStatistics;
    readonly manga?: UserStatistics;
}

export interface UserStatistics {
    readonly count: number;
    readonly meanScore: number;
    readonly standardDeviation: number;
    readonly minutesWatched: number;
    readonly episodesWatched: number;
    readonly chaptersRead: number;
    readonly volumesRead: number;
    readonly formats?: UserFormatStatistic[];
    readonly statuses?: UserStatusStatistic[];
    readonly scores?: [UserScoreStatistic];
    readonly lengths?: [UserLengthStatistic];
    readonly releaseYears?: [UserReleaseYearStatistic];
    readonly startYears?: [UserStartYearStatistic];
    readonly genres?: [UserGenreStatistic];
    readonly tags?: [UserTagStatistic];
    readonly countries?: [UserCountryStatistic];
    readonly voiceActors?: [UserVoiceActorStatistic];
    readonly staff?: [UserStaffStatistic];
    readonly studios?: [UserStudioStatistic];
}

export interface UserStatistic {
    readonly count: number;
    readonly meanScore: number;
    readonly minutesWatched: number;
    readonly chaptersRead: number;
    readonly mediaIds: number[];
}

export interface UserFormatStatistic extends UserStatistic {
    readonly format?: MediaFormat;
}

export interface UserStatusStatistic extends UserStatistic {
    readonly status?: MediaListStatus;
}

export interface UserScoreStatistic extends UserStatistic {
    readonly score?: number | null;
}

export interface UserLengthStatistic extends UserStatistic {
    readonly length?: string | null;
}

export interface UserReleaseYearStatistic extends UserStatistic {
    readonly releaseYear?: number | null;
}

export interface UserStartYearStatistic extends UserStatistic {
    readonly startYear?: number | null;
}

export interface UserGenreStatistic extends UserStatistic {
    readonly genre?: string | null;
}

export interface UserTagStatistic extends UserStatistic {
    readonly tag?: MediaTag;
}

export interface UserCountryStatistic extends UserStatistic {
    readonly country?: string | null; // ISO 3166-1 alpha-2 country code
}

export interface UserVoiceActorStatistic extends UserStatistic {
    readonly voiceActor?: Staff;
    readonly characterIds: number[];
}

export interface UserStaffStatistic extends UserStatistic {
    readonly staff?: Staff;
}

export interface UserStudioStatistic extends UserStatistic {
    readonly studio?: Studio;
}

export enum ModRole {
    ADMIN = 'ADMIN',
    LEAD_DEVELOPER = 'LEAD_DEVELOPER',
    DEVELOPER = 'DEVELOPER',
    LEAD_COMMUNITY = 'LEAD_COMMUNITY',
    COMMUNITY = 'COMMUNITY',
    DISCORD_COMMUNITY = 'DISCORD_COMMUNITY',
    LEAD_ANIME_DATA = 'LEAD_ANIME_DATA',
    ANIME_DATA = 'ANIME_DATA',
    LEAD_MANGA_DATA = 'LEAD_MANGA_DATA',
    MANGA_DATA = 'MANGA_DATA',
    LEAD_SOCIAL_MEDIA = 'LEAD_SOCIAL_MEDIA',
    SOCIAL_MEDIA = 'SOCIAL_MEDIA',
    RETIRED = 'RETIRED'
}

export interface UserPreviousName {
    name?: string | null;
    createdAt?: number | null;
    updatedAt?: number | null;
}
