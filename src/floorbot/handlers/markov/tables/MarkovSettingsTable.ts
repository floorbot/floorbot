import fs from 'fs';
import { Pool } from "mariadb";
import path from 'path';
import { MariaDBTable, PartRow, SelectionRow } from '../../../../discord/MariaDBTable.js';

export interface MarkovSettingsRow {
    readonly guild_id: string;
    readonly channel_id: string;
    readonly minutes: number;
    readonly messages: number;
    readonly posting: boolean;
    readonly tracking: boolean;
    readonly links: 'enable' | 'disable' | 'suppress' | 'substitute';
    readonly mentions: 'enable' | 'disable' | 'suppress' | 'substitute';
    readonly owoify: boolean;
    readonly bots: boolean;
}

export class MarkovSettingsTable extends MariaDBTable<MarkovSettingsRow, Pick<MarkovSettingsRow, 'guild_id' | 'channel_id'>> {

    public static readonly DEFAULT_MESSAGES: MarkovSettingsRow['messages'] = 50;
    public static readonly DEFAULT_MINUTES: MarkovSettingsRow['minutes'] = 100;
    public static readonly DEFAULT_POSTING: MarkovSettingsRow['posting'] = false;
    public static readonly DEFAULT_TRACKING: MarkovSettingsRow['tracking'] = false;
    public static readonly DEFAULT_LINKS: MarkovSettingsRow['links'] = 'suppress';
    public static readonly DEFAULT_MENTIONS: MarkovSettingsRow['mentions'] = 'suppress';
    public static readonly DEFAULT_OWOIFY: MarkovSettingsRow['owoify'] = false;
    public static readonly DEFAULT_BOTS: MarkovSettingsRow['bots'] = true;

    constructor(pool: Pool) {
        super(pool, 'markov_settings');
    }

    public async selectChannel({ guild_id, channel_id }: PartRow<MarkovSettingsRow, 'guild_id' | 'channel_id'>): Promise<MarkovSettingsRow> {
        const rows = await this.select({ guild_id, channel_id }, { limit: 1 });
        return rows[0] || {
            guild_id,
            channel_id,
            minutes: MarkovSettingsTable.DEFAULT_MINUTES,
            messages: MarkovSettingsTable.DEFAULT_MESSAGES,
            posting: MarkovSettingsTable.DEFAULT_POSTING,
            tracking: MarkovSettingsTable.DEFAULT_TRACKING,
            links: MarkovSettingsTable.DEFAULT_LINKS,
            mentions: MarkovSettingsTable.DEFAULT_MENTIONS,
            owoify: MarkovSettingsTable.DEFAULT_OWOIFY,
            bots: MarkovSettingsTable.DEFAULT_BOTS
        };
    }

    public async insertChannel(data: SelectionRow<MarkovSettingsRow, 'guild_id' | 'channel_id'>): Promise<MarkovSettingsRow> {
        const existing = await this.selectChannel(data);
        const settings = {
            guild_id: data.guild_id,
            channel_id: data.channel_id,
            minutes: Math.abs(data.minutes ?? existing.minutes),
            messages: Math.abs(data.messages ?? existing.messages),
            posting: data.posting ?? existing.posting,
            tracking: data.tracking ?? existing.tracking,
            links: data.links ?? existing.links,
            mentions: data.mentions ?? existing.mentions,
            owoify: data.owoify ?? existing.owoify,
            bots: data.bots ?? existing.bots
        };
        await this.insert(settings);
        return settings;
    }

    public async createTable(): Promise<void> {
        const sql = fs.readFileSync(`${path.resolve()}/res/schemas/${this.table}.sql`, 'utf8');
        return this.query(sql).catch(error => {
            if (error.code !== 'ER_TABLE_EXISTS_ERROR') throw error.reason;
        });
    }
}
