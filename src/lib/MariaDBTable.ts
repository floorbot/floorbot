import { NoExtraProperties } from './types/no-extra-properties.js';
import { Pool } from 'mariadb';

export abstract class MariaDBTable<R extends P & F, P, F = {}> {

    protected readonly table: string;
    protected readonly pool: Pool;

    constructor(pool: Pool, table: string) {
        this.table = table;
        this.pool = pool;
    }

    public async query(sql: string, data?: NoExtraProperties<Partial<R>>): Promise<any> {
        return this.pool.query({ namedPlaceholders: true, sql: sql }, data);
    }

    public async select(data: NoExtraProperties<Partial<R>>, constraints?: { limit?: number | null; order?: { [key in keyof R]?: 'DESC' | 'ASC' }; }): Promise<R[]> {
        const { limit, order } = constraints ?? {};
        const conditions = Object.keys(data).map(key => `${key} = :${key}`).join(' AND ');
        const orderString = order ? Object.entries(order).map(([key, value]) => `${key} ${value}`).join(', ') : '';
        const sql = `SELECT * FROM ${this.table} WHERE ${conditions}${orderString.length ? ` ORDER BY ${orderString}` : ''}${limit ? ` LIMIT ${limit}` : ''};`;
        return this.query(sql, data);
    }

    public async selectCount(column: keyof R, data: NoExtraProperties<Partial<R>>): Promise<{ count: bigint; }> {
        const conditions = Object.keys(data).map(key => `${key} = :${key}`).join(' AND ');
        const sql = `SELECT COUNT(${String(column)}) AS count FROM ${this.table} WHERE ${conditions};`;
        return (await this.query(sql, data))[0];
    }

    public async insert(data: NoExtraProperties<R>): Promise<void> {
        const values = Object.keys(data).map(key => `:${key}`).join(', ');
        const sql = `REPLACE INTO ${this.table} VALUES (${values});`;
        return this.query(sql, data);
    }

    public async delete(data: NoExtraProperties<Partial<R>>): Promise<void> {
        const conditions = Object.keys(data).map(key => `${key} = :${key}`).join(' AND ');
        const sql = `DELETE FROM ${this.table} WHERE ${conditions};`;
        return this.query(sql, data);
    }

    public abstract createTable(): Promise<void>;
}
