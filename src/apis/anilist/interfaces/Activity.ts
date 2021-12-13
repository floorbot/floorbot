import { Media } from "./Media.js";
import { User } from "./User.js";

export interface ActivityVariables {
    readonly userId?: number;
    readonly type?: ActivityType;
}

export type ActivityUnion = TextActivity & ListActivity & MessageActivity;

export interface Activity {
    readonly id?: number;
    readonly type?: ActivityType;
    readonly replyCount?: number;
    readonly siteUrl?: string | null;
    readonly isLocked?: boolean | null;
    readonly isSubscribed?: boolean | null;
    readonly likeCount: number;
    readonly isLiked?: boolean | null;
    readonly createdAt?: number;
    readonly replies?: ActivityReply[];
    readonly likes?: User[];
}

export interface TextActivity extends Activity {
    readonly userId?: number | null;
    readonly text?: string | null;
    readonly user?: User;
}

export interface ListActivity extends Activity {
    readonly userId?: number | null;
    readonly status?: string | null;
    readonly progress?: string | null;
    readonly user?: User;
    readonly media?: Media;
}

export interface MessageActivity extends Activity {
    readonly recipientId?: number | null;
    readonly messengerId?: number | null;
    readonly message?: string | null;
    readonly isPrivate?: boolean | null;
    readonly recipient?: User;
    readonly messenger?: User;
}

export enum ActivityType {
    TEXT = 'TEXT',
    ANIME_LIST = 'ANIME_LIST',
    MANGA_LIST = 'MANGA_LIST',
    MESSAGE = 'MESSAGE',
    MEDIA_LIST = 'MEDIA_LIST'
}

export interface ActivityReply {
    readonly id: number;
    readonly userId?: number | null;
    readonly activityId?: number | null;
    readonly text?: string | null;
    readonly likeCount: number;
    readonly isLiked?: boolean | null;
    readonly createdAt: number;
    readonly user?: User;
    readonly likes?: User[];
}
