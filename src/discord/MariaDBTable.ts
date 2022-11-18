import { Pool } from 'mariadb';

// First, define a type that, when passed a union of keys, creates an object which
// cannot have those properties. I couldn't find a way to use this type directly,
// but it can be used with the below type.
export type Impossible<K extends keyof any> = { [P in K]: never; };

// The secret sauce! Provide it the type that contains only the properties you want,
// and then a type that extends that type, based on what the caller provided using generics.
export type NoExtraProperties<T, U extends T = T> = U & Impossible<Exclude<keyof U, keyof T>>;

export type SelectOrder<R> = { [key in keyof R]?: 'DESC' | 'ASC' };
export type PartialRow<R> = NoExtraProperties<Partial<R>>;
export type Row<R> = NoExtraProperties<R>;

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

    public async select(data: PartialRow<R>, { limit, order }: { limit?: number | null; order?: SelectOrder<R>; } = {}): Promise<R[]> {
        const conditions = Object.entries(data).map(([key, value]) => value === null ? `${key} IS NULL` : `${key} = :${key}`).join(' AND ');
        const orderString = order ? Object.entries(order).map(([key, value]) => `${key} ${value}`).join(', ') : '';
        const sql = `SELECT * FROM ${this.table} WHERE ${conditions}${orderString.length ? ` ORDER BY ${orderString}` : ''}${limit ? ` LIMIT ${limit}` : ''};`;
        return this.query(sql, data);
    }

    public async selectAll({ limit, order }: { limit?: number | null; order?: SelectOrder<R>; } = {}): Promise<R[]> {
        const orderString = order ? Object.entries(order).map(([key, value]) => `${key} ${value}`).join(', ') : '';
        const sql = `SELECT * FROM ${this.table} ${orderString.length ? ` ORDER BY ${orderString}` : ''}${limit ? ` LIMIT ${limit}` : ''};`;
        return this.query(sql);
    }

    public async selectCount(column: keyof R, data: PartialRow<R>): Promise<{ count: bigint; }> {
        const conditions = Object.entries(data).map(([key, value]) => value === null ? `${key} IS NULL` : `${key} = :${key}`).join(' AND ');
        const sql = `SELECT COUNT(${String(column)}) AS count FROM ${this.table} WHERE ${conditions};`;
        return (await this.query(sql, data))[0];
    }

    public async insert(data: Row<R>): Promise<void> {
        const values = Object.keys(data).map(key => `:${key}`).join(', ');
        const sql = `REPLACE INTO ${this.table} VALUES (${values});`;
        return this.query(sql, data);
    }

    public async delete(data: PartialRow<R>): Promise<void> {
        const conditions = Object.entries(data).map(([key, value]) => value === null ? `${key} IS NULL` : `${key} = :${key}`).join(' AND ');
        const sql = `DELETE FROM ${this.table} WHERE ${conditions};`;
        return this.query(sql, data);
    }

    public abstract createTable(): Promise<void>;
}
