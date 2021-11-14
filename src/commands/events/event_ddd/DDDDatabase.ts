import { Pool } from 'mariadb';
import path from 'path';
import fs from 'fs';

export type DDDOptional<T, K extends keyof T> = Omit<T, K> & Partial<T>;

export type DDDPartialSettingsRow = DDDOptional<DDDSettingsRow, 'channel_id' | 'event_role_id' | 'passing_role_id' | 'failed_role_id'>;
export interface DDDSettingsRow {
    readonly guild_id: string,
    readonly year: number,
    readonly channel_id: string | null,
    readonly event_role_id: string | null,
    readonly passing_role_id: string | null,
    readonly failed_role_id: string | null
}

export type DDDPartialParticipantRow = DDDOptional<DDDParticipantRow, 'zone' | 'failed'>;
export interface DDDParticipantRow {
    readonly guild_id: string,
    readonly year: number,
    readonly user_id: string,
    readonly zone: string,
    readonly failed: number
}

export type DDDPartialNutRow = DDDOptional<DDDNutRow, 'epoch' | 'description'>;
export interface DDDNutRow {
    readonly guild_id: string,
    readonly year: number,
    readonly user_id: string,
    readonly epoch: string,
    readonly description: string | null
}

export class DDDDatabase {

    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    /** --- Settings Functions --- **/

    public async updateSettings(partial: DDDPartialSettingsRow): Promise<DDDSettingsRow> {
        const existing = await this.fetchSettings(partial);
        const sql = 'REPLACE INTO ddd_settings VALUES (:guild_id, :year, :channel_id, :event_role_id, :passing_role_id, :failed_role_id)';
        const settingsRow = {
            ...partial,
            channel_id: partial.channel_id ?? ('channel_id' in partial ? null : existing.channel_id),
            event_role_id: partial.event_role_id ?? ('event_role_id' in partial ? null : existing.event_role_id),
            passing_role_id: partial.passing_role_id ?? ('passing_role_id' in partial ? null : existing.passing_role_id),
            failed_role_id: partial.failed_role_id ?? ('failed_role_id' in partial ? null : existing.failed_role_id),
        };
        await this.pool.query({ namedPlaceholders: true, sql: sql }, settingsRow);
        return settingsRow;
    }

    public async fetchSettings(partial: DDDPartialSettingsRow): Promise<DDDSettingsRow> {
        const sql = 'SELECT * FROM ddd_settings WHERE guild_id = :guild_id AND year = :year LIMIT 1';
        const rows = await this.pool.query({ namedPlaceholders: true, sql: sql }, partial);
        return rows.length ? rows[0] : { ...partial, channel_id: null, event_role_id: null, passing_role_id: null, failed_role_id: null }
    }

    /** --- Participant Functions --- **/

    public async setParticipant(participantRow: DDDParticipantRow): Promise<DDDParticipantRow> {
        const sql = 'REPLACE INTO ddd_participant VALUES (:guild_id, :year, :user_id, :zone, :failed)';
        await this.pool.query({ namedPlaceholders: true, sql: sql }, participantRow);
        return participantRow;
    }

    public async deleteParticipant(partial: DDDPartialParticipantRow): Promise<void> {
        const sql = 'DELETE FROM ddd_participant WHERE guild_id = :guild_id AND year = :year AND user_id = :user_id';
        await this.pool.query({ namedPlaceholders: true, sql: sql }, partial);
    }

    public async fetchParticipant(partial: DDDPartialParticipantRow): Promise<DDDParticipantRow | null> {
        const sql = 'SELECT * FROM ddd_participant WHERE guild_id = :guild_id AND year = :year AND user_id = :user_id LIMIT 1';
        const rows = await this.pool.query({ namedPlaceholders: true, sql: sql }, partial);
        return rows.length ? rows[0] : null;
    }

    public async fetchAllParticipants(scope: DDDPartialSettingsRow | number): Promise<DDDParticipantRow[]> {
        const sql = (typeof scope === 'number' ?
            'SELECT * FROM ddd_participant WHERE year = :year' :
            'SELECT * FROM ddd_participant WHERE guild_id = :guild_id AND year = :year'
        );
        const data = typeof scope === 'number' ? { year: scope } : scope;
        return await this.pool.query({ namedPlaceholders: true, sql: sql }, data);
    }

    /** --- Nut Functions --- **/

    public async setNut(nutRow: DDDNutRow): Promise<DDDNutRow> {
        const sql = 'REPLACE INTO ddd_nut VALUES (:guild_id, :year, :user_id, :epoch, :description)';
        await this.pool.query({ namedPlaceholders: true, sql: sql }, nutRow);
        return nutRow;
    }

    public async fetchAllNuts(partial: DDDPartialParticipantRow): Promise<DDDNutRow[]> {
        const sql = 'SELECT * FROM ddd_nut WHERE guild_id = :guild_id AND year = :year AND user_id = :user_id';
        return await this.pool.query({ namedPlaceholders: true, sql: sql }, partial);
    }

    /** --- Create Database Tables --- **/

    public async createTables(): Promise<void> {
        return Promise.allSettled([
            this.pool.query(fs.readFileSync(`${path.resolve()}/res/schemas/ddd_participant.sql`, 'utf8')),
            this.pool.query(fs.readFileSync(`${path.resolve()}/res/schemas/ddd_settings.sql`, 'utf8')),
            this.pool.query(fs.readFileSync(`${path.resolve()}/res/schemas/ddd_nut.sql`, 'utf8'))
        ]).then(ress => {
            return ress.forEach(res => {
                if (res.status === 'fulfilled') return;
                if (res.reason.code !== 'ER_TABLE_EXISTS_ERROR') throw res.reason;
            })
        })
    }
}
