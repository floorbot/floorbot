import fs from 'fs';
import { Pool } from 'mariadb';
import path from 'path';
import { MariaDBTable, SelectionRow, SelectOrder } from '../../../../discord/MariaDBTable.js';

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

    public async selectRandomState(data: SelectionRow<MarkovStateRow, 'channel_id'>, { limit = 100, order = { epoch: 'DESC' } }: { limit?: number; order?: SelectOrder<MarkovStateRow>; } = {}): Promise<MarkovStateRow | null> {
        const conditionString = this.createConditionString(data);
        const orderString = this.createOrderString(order);
        const limitString = this.createLimitString(limit);
        const sql = `SELECT * FROM (SELECT * FROM ${this.table} ${conditionString} ${orderString} ${limitString}) as T ORDER BY RAND() LIMIT 1;`;
        const rows = await this.query(sql, data);
        return rows[0] || null;
    }

    public async selectStateTotals(data: SelectionRow<Omit<MarkovStateRow, 'bot'>, 'channel_id'>): Promise<MarkovStateTotals> {
        const conditionString = this.createConditionString(data);
        return {
            users: (await this.query(`SELECT COUNT(DISTINCT user_id) AS total FROM ${this.table} ${conditionString} AND bot = false;`, data))[0]?.total ?? 0,
            bots: (await this.query(`SELECT COUNT(DISTINCT user_id) AS total FROM ${this.table} ${conditionString} AND bot = true;`, data))[0]?.total ?? 0,
            messages: (await this.query(`SELECT COUNT(DISTINCT message_id) AS total FROM ${this.table} ${conditionString};`, data))[0]?.total ?? 0
        };
    }

    public async createTable(): Promise<void> {
        const sql = fs.readFileSync(`${path.resolve()}/res/schemas/${this.table}.sql`, 'utf8');
        return this.query(sql).catch(error => {
            if (error.code !== 'ER_TABLE_EXISTS_ERROR') throw error.reason;
        });
    }
}
