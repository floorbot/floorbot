export interface Rule34APIPost {
    readonly count: {
        readonly total: number;
        readonly offset: number;
    };
    readonly height: string;
    readonly score: string;
    readonly file_url: string;
    readonly parent_id: string;
    readonly sample_url: string;
    readonly sample_width: string;
    readonly sample_height: string;
    readonly preview_url: string;
    readonly rating: string;
    readonly tags: string;
    readonly id: string;
    readonly width: string;
    readonly change: string;
    readonly md5: string;
    readonly creator_id: string;
    readonly has_children: string;
    readonly created_at: string;
    readonly status: string;
    readonly source: string;
    readonly has_notes: string;
    readonly has_comments: string;
    readonly preview_width: string;
    readonly preview_height: string;
}
