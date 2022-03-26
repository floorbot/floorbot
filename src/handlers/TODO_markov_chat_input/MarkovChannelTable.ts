import { MariaDBTable } from "../../lib/MariaDBTable.js";
import { Guild, GuildChannel } from "discord.js";
import { Pool } from "mariadb";
import path from 'path';
import fs from 'fs';

export interface MarkovChannelRow {
    readonly guild_id: string,
    readonly channel_id: string,
    readonly minutes: number,
    readonly messages: number,
    readonly posting: boolean,
    readonly tracking: boolean,
    readonly links: boolean,
    readonly mentions: boolean,
    readonly owoify: boolean,
    readonly quoting: boolean;
}

export class MarkovChannelTable extends MariaDBTable<MarkovChannelRow, Pick<MarkovChannelRow, 'guild_id' | 'channel_id'>> {

    private static readonly DEFAULT_MESSAGES = 50;
    private static readonly DEFAULT_MINUTES = 100;

    constructor(pool: Pool) {
        super(pool, 'markov_channel');
    }

    public async selectChannel(channel: GuildChannel): Promise<MarkovChannelRow> {
        const query = { guild_id: channel.guild.id, channel_id: channel.id };
        const rows = await this.select(query, 1);
        return rows[0] || {
            ...query,
            minutes: MarkovChannelTable.DEFAULT_MINUTES,
            messages: MarkovChannelTable.DEFAULT_MESSAGES,
            posting: false,
            tracking: false,
            links: false,
            mentions: false,
            owoify: false,
            quoting: true
        };
    }

    public async selectChannels(guild: Guild): Promise<MarkovChannelRow[]> {
        const query = { guild_id: guild.id };
        return this.select(query);
    }

    public async insertChannel(channel: GuildChannel, options: { messages?: number, minutes?: number, posting?: boolean, tracking?: boolean, links?: boolean, mentions?: boolean, owoify?: boolean, quoting?: boolean; }): Promise<MarkovChannelRow> {
        const existing = await this.selectChannel(channel);
        const data = {
            guild_id: channel.guild.id,
            channel_id: channel.id,
            minutes: Math.abs(options.minutes ?? existing.minutes),
            messages: Math.abs(options.messages ?? existing.messages),
            posting: options.posting ?? existing.posting,
            tracking: options.tracking ?? existing.tracking,
            links: options.links ?? existing.links,
            mentions: options.mentions ?? existing.mentions,
            owoify: options.owoify ?? existing.owoify,
            quoting: options.quoting ?? existing.quoting
        };
        await this.insert(data);
        return data;
    }

    public async deleteChannels(scope: Guild | GuildChannel): Promise<void> {
        if (scope instanceof GuildChannel) return this.delete({ guild_id: scope.guild.id, channel_id: scope.id });
        if (scope instanceof Guild) return this.delete({ guild_id: scope.id });
    }

    public async selectTotalChannels(guild: Guild): Promise<number> {
        const sql = 'SELECT COUNT(*) AS total FROM markov_channel WHERE guild_id = :guild_id';
        const rows = await this.query(sql, { guild_id: guild.id });
        return rows[0] ? rows[0].total : 0;
    }

    public async createTable(): Promise<void> {
        const sql = fs.readFileSync(`${path.resolve()}/res/schemas/markov_channel.sql`, 'utf8');
        return this.query(sql).catch(error => {
            if (error.code !== 'ER_TABLE_EXISTS_ERROR') throw error.reason;
        });
    }
}
