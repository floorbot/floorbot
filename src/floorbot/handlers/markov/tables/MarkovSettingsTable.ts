import fs from 'fs';
import { Pool } from "mariadb";
import path from 'path';
import { MariaDBTable } from '../../../../discord/MariaDBTable.js';

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

    public static readonly DEFAULT_MESSAGES = 50;
    public static readonly DEFAULT_MINUTES = 100;
    public static readonly DEFAULT_POSTING = false;
    public static readonly DEFAULT_TRACKING = false;
    public static readonly DEFAULT_LINKS = 'suppress';
    public static readonly DEFAULT_MENTIONS = 'suppress';
    public static readonly DEFAULT_OWOIFY = false;
    public static readonly DEFAULT_BOTS = true;

    constructor(pool: Pool) {
        super(pool, 'markov_settings');
    }

    public async selectChannel({ guildId, channelId }: { guildId: string, channelId: string; }): Promise<MarkovSettingsRow> {
        const query = { guild_id: guildId, channel_id: channelId };
        const rows = await this.select(query, { limit: 1 });
        return rows[0] || {
            ...query,
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

    public async selectChannels({ guildId, posting }: { guildId: string, posting?: boolean; }): Promise<MarkovSettingsRow[]> {
        const query = { guild_id: guildId, ...(posting !== undefined && { posting }) };
        return this.select(query);
    }

    public async insertChannel({ guildId, channelId }: { guildId: string, channelId: string; }, options: Partial<Omit<MarkovSettingsRow, 'guild_id' | 'channel_id'>>): Promise<MarkovSettingsRow> {
        const existing = await this.selectChannel({ guildId, channelId });
        const data = {
            guild_id: guildId,
            channel_id: channelId,
            minutes: Math.abs(options.minutes ?? existing.minutes),
            messages: Math.abs(options.messages ?? existing.messages),
            posting: options.posting ?? existing.posting,
            tracking: options.tracking ?? existing.tracking,
            links: options.links ?? existing.links,
            mentions: options.mentions ?? existing.mentions,
            owoify: options.owoify ?? existing.owoify,
            bots: options.bots ?? existing.bots
        };
        await this.insert(data);
        return data;
    }

    public async deleteChannels({ guildId, channelId }: { guildId?: string, channelId?: string; }): Promise<void> {
        if (guildId && !channelId) return this.delete({ guild_id: guildId });
        if (channelId) return this.delete({ channel_id: channelId });
    }

    public async selectTotalChannels({ guildId }: { guildId: string; }): Promise<number> {
        const sql = 'SELECT COUNT(*) AS total FROM markov_channel WHERE guild_id = :guild_id';
        const rows = await this.query(sql, { guild_id: guildId });
        return rows[0] ? rows[0].total : 0;
    }

    public async createTable(): Promise<void> {
        const sql = fs.readFileSync(`${path.resolve()}/res/schemas/${this.table}.sql`, 'utf8');
        return this.query(sql).catch(error => {
            if (error.code !== 'ER_TABLE_EXISTS_ERROR') throw error.reason;
        });
    }
}
