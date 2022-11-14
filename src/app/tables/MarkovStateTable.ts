import { MariaDBTable } from '../../discord/MariaDBTable.js';
import { Pool } from 'mariadb';
import path from 'path';
import fs from 'fs';

export default interface MarkovStateRow {
    readonly epoch: number,
    readonly bot: boolean,
    readonly user_id: string,
    readonly guild_id: string,
    readonly channel_id: string,
    readonly message_id: string,
    readonly message_part: number,
    readonly current_state: string | null,
    readonly next_value: string | null;
}

export class MarkovStateTable extends MariaDBTable<MarkovStateRow, Pick<MarkovStateRow, 'channel_id' | 'message_id' | 'message_part'>> {

    constructor(pool: Pool) {
        super(pool, 'markov_state');
    }

    public async selectRandomState({ currentState, channelId, limit = 100 }: { currentState: string | null, channelId: string, limit?: number; }): Promise<MarkovStateRow | null> {
        const sql = currentState ?
            `SELECT * FROM (SELECT * FROM ${this.table} WHERE channel_id = :channel_id AND current_state = :current_state ORDER BY epoch DESC LIMIT ${limit}) as T ORDER BY RAND() LIMIT 1;` :
            `SELECT * FROM (SELECT * FROM ${this.table} WHERE channel_id = :channel_id AND current_state IS NULL ORDER BY epoch DESC LIMIT ${limit}) as T ORDER BY RAND() LIMIT 1;`;
        const rows = await this.query(sql, { current_state: currentState, channel_id: channelId });
        return rows[0] || null;
    }



    public async selectStringsTotals(channel: GuildChannel): Promise<MarkovStringTotals> {
        const query = { guild_id: channel.guild.id, channel_id: channel.id };
        const sql_total_all = 'SELECT COUNT(*) AS total FROM markov_string WHERE guild_id = :guild_id AND channel_id = :channel_id';
        const sql_total_users = 'SELECT COUNT(*) AS total FROM markov_string WHERE guild_id = :guild_id AND channel_id = :channel_id AND bot = false';
        const total_all_rows = await this.query(sql_total_all, query);
        const total_users_rows = await this.query(sql_total_users, query);
        return {
            total: total_all_rows.length ? total_all_rows[0].total : 0,
            users: total_users_rows.length ? total_users_rows[0].total : 0
        };
    }

    public async createTable(): Promise<void> {
        const sql = fs.readFileSync(`${path.resolve()}/res/schemas/${this.table}.sql`, 'utf8');
        return this.query(sql).catch(error => {
            if (error.code !== 'ER_TABLE_EXISTS_ERROR') throw error.reason;
        });
    }
}
