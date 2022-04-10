export type DDDPartialSettingsRow = Omit<DDDSettingsRow, 'channel_id' | 'event_role_id' | 'passing_role_id' | 'failed_role_id'> & Partial<DDDSettingsRow>;

export interface DDDSettingsRow {
    readonly guild_id: string,
    readonly year: number,
    readonly channel_id: string | null,
    readonly event_role_id: string | null,
    readonly passing_role_id: string | null,
    readonly failed_role_id: string | null
}
