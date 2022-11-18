import fs from 'fs';
import { Pool } from 'mariadb';
import path from 'path';
import { MariaDBTable } from '../../../../discord/MariaDBTable.js';

export default interface MarkovStateRow {
    readonly epoch: number;
    readonly user_id: string;
    readonly guild_id: string;
    readonly channel_id: string;
    readonly message_id: string;
    readonly message_part: number;
    readonly current_state: string | null;
    readonly next_value: string | null;
    readonly bot: boolean;
    readonly link: boolean;
    readonly mention: boolean;
}

export interface MarkovStateTotals {
    messages: number,
    users: number;
    bots: number;
}

export class MarkovStateTable extends MariaDBTable<MarkovStateRow, Pick<MarkovStateRow, 'channel_id' | 'message_id' | 'message_part'>> {

    constructor(pool: Pool) {
        super(pool, 'markov_state');
    }

    public async selectRandomState({ currentState, channelId, bot, link, mention, limit = 100 }: { currentState: string | null, channelId: string, bot?: boolean, link?: boolean, mention?: boolean, limit?: number; }): Promise<MarkovStateRow | null> {
        const data = {
            channel_id: channelId,
            ...(bot === false && { bot }),
            ...(link === false && { link }),
            ...(mention === false && { mention })
        };
        const conditions = Object.keys(data).map(key => `${key} = :${key}`).join(' AND ');
        const sql = currentState ?
            `SELECT * FROM (SELECT * FROM ${this.table} WHERE ${conditions} AND current_state = :current_state ORDER BY epoch DESC LIMIT ${limit}) as T ORDER BY RAND() LIMIT 1;` :
            `SELECT * FROM (SELECT * FROM ${this.table} WHERE ${conditions} AND current_state IS NULL ORDER BY epoch DESC LIMIT ${limit}) as T ORDER BY RAND() LIMIT 1;`;
        const rows = await this.query(sql, { ...data, ...(currentState && { current_state: currentState }) });
        return rows[0] || null;
    }

    public async selectStateTotals({ channelId }: { channelId: string; }): Promise<MarkovStateTotals> {
        const query = { channel_id: channelId };
        return {
            users: (await this.query(`SELECT COUNT(DISTINCT user_id) AS total FROM ${this.table} WHERE channel_id = :channel_id AND bot = false;`, query))[0]?.total ?? 0,
            bots: (await this.query(`SELECT COUNT(DISTINCT user_id) AS total FROM ${this.table} WHERE channel_id = :channel_id AND bot = true;`, query))[0]?.total ?? 0,
            messages: (await this.query(`SELECT COUNT(DISTINCT message_id) AS total FROM ${this.table} WHERE channel_id = :channel_id;`, query))[0]?.total ?? 0
        };
    }

    public async createTable(): Promise<void> {
        const sql = fs.readFileSync(`${path.resolve()}/res/schemas/${this.table}.sql`, 'utf8');
        return this.query(sql).catch(error => {
            if (error.code !== 'ER_TABLE_EXISTS_ERROR') throw error.reason;
        });
    }
}
