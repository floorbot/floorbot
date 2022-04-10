export type DDDPartialParticipantRow = Omit<DDDParticipantRow, 'zone' | 'failed'> & Partial<DDDParticipantRow>;

export interface DDDParticipantRow {
    readonly guild_id: string,
    readonly year: number,
    readonly user_id: string,
    readonly zone: string,
    readonly failed: number
}
