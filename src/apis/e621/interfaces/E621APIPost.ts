export interface E621APIPost {
    readonly id: number;
    readonly created_at: string;
    readonly updated_at: string;
    readonly file: {
        readonly width: number;
        readonly height: number;
        readonly ext: string;
        readonly size: number;
        readonly md5: string;
        readonly url: string;
    };
    readonly preview: {
        readonly width: number;
        readonly height: number;
        readonly url: string;
    };
    readonly sample: {
        readonly has: boolean;
        readonly height: number;
        readonly width: number;
        readonly url: string;
        readonly alternates: {};
    };
    readonly score: {
        readonly up: number;
        readonly down: number;
        readonly total: number;
    };
    readonly tags: {
        readonly general: Array<string>;
        readonly species: Array<string>;
        readonly character: Array<string>;
        readonly copyright: Array<string>;
        readonly artist: Array<string>;
        readonly invalid: Array<string>;
        readonly lore: Array<string>;
        readonly meta: Array<string>;
    };
    readonly locked_tags: Array<string>;
    readonly change_seq: number;
    readonly flags: {
        readonly pending: boolean;
        readonly flagged: boolean;
        readonly note_locked: boolean;
        readonly status_locked: boolean;
        readonly rating_locked: boolean;
        readonly deleted: boolean;
    };
    readonly rating: string;
    readonly fav_count: number;
    readonly sources: Array<string>;
    readonly pools: [];
    readonly relationships: {
        readonly parent_id: number;
        readonly has_children: boolean;
        readonly has_active_children: boolean;
        readonly children: [];
    };
    readonly approver_id: number;
    readonly uploader_id: number;
    readonly description: string;
    readonly comment_count: number;
    readonly is_favorited: boolean;
    readonly has_notes: boolean;
    readonly duration: number;
}
