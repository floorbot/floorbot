export interface E621APITag {
    readonly id: number,
    readonly name: string,
    readonly post_count: number,
    readonly related_tags: string,
    readonly related_tags_updated_at: string,
    readonly category: number,
    readonly is_locked: boolean,
    readonly created_at: string,
    readonly updated_at: string
}
