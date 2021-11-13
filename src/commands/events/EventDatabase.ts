import { Pool } from 'mariadb';
import * as fs from 'fs';
import path from 'path';

export type EventOptional<T, K extends keyof T> = Omit<T, K> & Partial<T>;

export type EventPartialSettingsRow = EventOptional<EventSettingsRow, 'channel_id' | 'event_role_id' | 'passing_role_id' | 'failed_role_id'>;
export interface EventSettingsRow {
    readonly event_name: string,
    readonly year: number,
    readonly guild_id: string,
    readonly channel_id: string | null,
    readonly event_role_id: string | null,
    readonly passing_role_id: string | null,
    readonly failed_role_id: string | null
}

export type EventPartialParticipantRow = EventOptional<EventParticipantRow, 'zone' | 'failed'>;
export interface EventParticipantRow {
    readonly event_name: string,
    readonly year: number,
    readonly guild_id: string,
    readonly user_id: string,
    readonly zone: string,
    readonly failed: number
}

export type EventPartialNutRow = EventOptional<EventNutRow, 'epoch' | 'description'>;
export interface EventNutRow {
    readonly event_name: string,
    readonly year: number,
    readonly guild_id: string,
    readonly user_id: string,
    readonly epoch: string,
    readonly description: string | null
}

export class EventDatabase {

    /** --- Settings Functions --- **/

    public static async updateSettings(pool: Pool, partial: EventPartialSettingsRow): Promise<EventSettingsRow> {
        const existing = await EventDatabase.fetchSettings(pool, partial);
        const sql = 'REPLACE INTO event_settings VALUES (:event_name, :year, :guild_id, :channel_id, :event_role_id, :passing_role_id, :failed_role_id)';
        const settingsRow = {
            ...partial,
            channel_id: partial.channel_id ?? ('channel_id' in partial ? null : existing.channel_id),
            event_role_id: partial.event_role_id ?? ('event_role_id' in partial ? null : existing.event_role_id),
            passing_role_id: partial.passing_role_id ?? ('passing_role_id' in partial ? null : existing.passing_role_id),
            failed_role_id: partial.failed_role_id ?? ('failed_role_id' in partial ? null : existing.failed_role_id),
        };
        await pool.query({ namedPlaceholders: true, sql: sql }, settingsRow);
        return settingsRow;
    }

    public static async fetchSettings(pool: Pool, partial: EventPartialSettingsRow): Promise<EventSettingsRow> {
        const sql = 'SELECT * FROM event_settings WHERE event_name = :event_name AND year = :year AND guild_id = :guild_id LIMIT 1';
        const rows = await pool.query({ namedPlaceholders: true, sql: sql }, partial);
        return rows.length ? rows[0] : { ...partial, channel_id: null, event_role_id: null, passing_role_id: null, failed_role_id: null }
    }

    /** --- Participant Functions --- **/

    public static async setParticipant(pool: Pool, participantRow: EventParticipantRow): Promise<EventParticipantRow> {
        const sql = 'REPLACE INTO event_participant VALUES (:event_name, :year, :guild_id, :user_id, :zone, :failed)';
        await pool.query({ namedPlaceholders: true, sql: sql }, participantRow);
        return participantRow;
    }

    public static async deleteParticipant(pool: Pool, partial: EventPartialParticipantRow): Promise<void> {
        const sql = 'DELETE FROM event_participant WHERE event_name = :event_name AND year = :year AND guild_id = :guild_id AND user_id = :user_id';
        await pool.query({ namedPlaceholders: true, sql: sql }, partial);
    }

    public static async fetchParticipant(pool: Pool, partial: EventPartialParticipantRow): Promise<EventParticipantRow | null> {
        const sql = 'SELECT * FROM event_participant WHERE event_name = :event_name AND year = :year AND guild_id = :guild_id AND user_id = :user_id LIMIT 1';
        const rows = await pool.query({ namedPlaceholders: true, sql: sql }, partial);
        return rows.length ? rows[0] : null;
    }

    public static async fetchAllParticipants(pool: Pool, scope: EventPartialSettingsRow | number): Promise<EventParticipantRow[]> {
        const sql = (typeof scope === 'number' ?
            'SELECT * FROM event_participant WHERE event_name = :event_name AND year = :year' :
            'SELECT * FROM event_participant WHERE event_name = :event_name AND year = :year AND guild_id = :guild_id'
        );
        const data = typeof scope === 'number' ? { year: scope } : scope;
        return await pool.query({ namedPlaceholders: true, sql: sql }, data);
    }

    /** --- Nut Functions --- **/

    public static async setNut(pool: Pool, nutRow: EventNutRow): Promise<EventNutRow> {
        const sql = 'REPLACE INTO event_nut VALUES (:event_name, :year, :guild_id, :user_id, :epoch, :description)';
        await pool.query({ namedPlaceholders: true, sql: sql }, nutRow);
        return nutRow;
    }

    public static async fetchAllNuts(pool: Pool, partial: EventPartialParticipantRow): Promise<EventNutRow[]> {
        const sql = 'SELECT * FROM event_nut WHERE event_name = :event_name AND year = :year AND guild_id = :guild_id AND user_id = :user_id';
        return await pool.query({ namedPlaceholders: true, sql: sql }, partial);
    }

    /** --- Create Database Tables --- **/

    public static async createTables(pool: Pool): Promise<void> {
        return Promise.allSettled([
            pool.query(fs.readFileSync(`${path.resolve()}/schemas/event_participant.sql`, 'utf8')),
            pool.query(fs.readFileSync(`${path.resolve()}/schemas/event_settings.sql`, 'utf8')),
            pool.query(fs.readFileSync(`${path.resolve()}/schemas/event_nut.sql`, 'utf8'))
        ]).then(ress => {
            return ress.forEach(res => {
                if (res.status === 'fulfilled') return;
                if (res.reason.code !== 'ER_TABLE_EXISTS_ERROR') throw res.reason;
            })
        })
    }
}
