export type DDDPartialNutRow = Omit<DDDNutRow, 'epoch' | 'description'> & Partial<DDDNutRow>;

export interface DDDNutRow {
    readonly guild_id: string,
    readonly year: number,
    readonly user_id: string,
    readonly epoch: string,
    readonly description: string | null
}
