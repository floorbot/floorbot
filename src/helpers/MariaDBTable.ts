import { Pool } from 'mariadb';

export abstract class MariaDBTable<R, T extends R = R> {

    protected readonly table: string;
    protected readonly pool: Pool;

    constructor(pool: Pool, table: string) {
        this.table = table;
        this.pool = pool;
    }

    public async query(sql: string, data?: NoExtraProperties<Partial<T>>): Promise<any> {
        return this.pool.query({ namedPlaceholders: true, sql: sql }, data);
    }

    public async select(data: NoExtraProperties<Partial<T>>, limit?: number | null): Promise<T[]> {
        const conditions = Object.keys(data).map(key => `${key} = :${key}`).join(' AND ');
        const sql = `SELECT * FROM ${this.table} WHERE ${conditions}${limit ? ` LIMIT ${limit}` : ''};`;
        return this.query(sql, data);
    }

    public async insert(data: NoExtraProperties<T>): Promise<void> {
        const values = Object.keys(data).map(key => `:${key}`).join(', ');
        const sql = `REPLACE INTO ${this.table} VALUES (${values});`;
        return this.query(sql, data);
    }

    public async delete(data: NoExtraProperties<Partial<T>>): Promise<void> {
        const conditions = Object.keys(data).map(key => `${key} = :${key}`).join(' AND ');
        const sql = `DELETE FROM ${this.table} WHERE ${conditions};`;
        return this.query(sql, data);
    }

    public abstract createTable(): Promise<void>;
}

// First, define a type that, when passed a union of keys, creates an object which
// cannot have those properties. I couldn't find a way to use this type directly,
// but it can be used with the below type.
export type Impossible<K extends keyof any> = {
    [P in K]: never;
};

// The secret sauce! Provide it the type that contains only the properties you want,
// and then a type that extends that type, based on what the caller provided
// using generics.
export type NoExtraProperties<T, U extends T = T> = U & Impossible<Exclude<keyof U, keyof T>>;
