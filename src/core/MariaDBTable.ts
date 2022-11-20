import { Pool } from 'mariadb';

// First, define a type that, when passed a union of keys, creates an object which
// cannot have those properties. I couldn't find a way to use this type directly,
// but it can be used with the below type.
export type Impossible<K extends keyof any> = { [P in K]: never; };

// The secret sauce! Provide it the type that contains only the properties you want,
// and then a type that extends that type, based on what the caller provided using generics.
export type NoExtraProperties<T, U extends T = T> = U & Impossible<Exclude<keyof U, keyof T>>;

// A type where select properties are made required without changing requirements of other properties
export type WithRequiredProp<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

export type SelectionRow<R, K extends keyof R> = NoExtraProperties<WithRequiredProp<Partial<R>, K>>;
export type PartRow<R, K extends keyof R> = NoExtraProperties<Pick<R, K>>;
export type SelectOrder<R> = { [key in keyof R]?: 'DESC' | 'ASC' };
export type PartialRow<R> = NoExtraProperties<Partial<R>>;
export type Row<R> = NoExtraProperties<R>;

export abstract class MariaDBTable<R extends P, P> {

    protected readonly table: string;
    protected readonly pool: Pool;

    constructor(pool: Pool, table: string) {
        this.table = table;
        this.pool = pool;
    }

    protected createConditionString(data: PartialRow<R>): string {
        const conditionString = Object.entries(data).map(([key, value]) => value === null ? `${key} IS NULL` : `${key} = :${key}`).join(' AND ');;
        return conditionString.length ? `WHERE ${conditionString}` : '';
    }

    protected createOrderString(order?: SelectOrder<R>): string {
        const orderString = order ? Object.entries(order).map(([key, value]) => `${key} ${value}`).join(', ') : '';
        return orderString.length ? `ORDER BY ${orderString}` : '';
    }

    protected createLimitString(limit?: number): string {
        return limit !== undefined && !isNaN(limit) ? `LIMIT ${limit}` : '';
    }

    public async query(sql: string, data?: NoExtraProperties<Partial<R>>): Promise<any> {
        return this.pool.query({ namedPlaceholders: true, sql: sql }, data);
    }

    public async select(data: PartialRow<R>, { limit, order }: { limit?: number; order?: SelectOrder<R>; } = {}): Promise<R[]> {
        const conditionString = this.createConditionString(data);
        const orderString = this.createOrderString(order);
        const limitString = this.createLimitString(limit);
        const sql = `SELECT * FROM ${this.table} ${conditionString} ${orderString} ${limitString};`;
        return this.query(sql, data);
    }

    public async selectAll({ limit, order }: { limit?: number; order?: SelectOrder<R>; } = {}): Promise<R[]> {
        const orderString = this.createOrderString(order);
        const limitString = this.createLimitString(limit);
        const sql = `SELECT * FROM ${this.table} ${orderString} ${limitString};`;
        return this.query(sql);
    }

    public async selectCount(column: keyof R, data: PartialRow<R>): Promise<{ count: bigint; }> {
        const conditionString = this.createConditionString(data);
        const sql = `SELECT COUNT(${String(column)}) AS count FROM ${this.table} ${conditionString};`;
        return (await this.query(sql, data))[0];
    }

    public async insert(data: Row<R>): Promise<void> {
        const values = Object.keys(data).map(key => `:${key}`).join(', ');
        const sql = `REPLACE INTO ${this.table} VALUES (${values});`;
        return this.query(sql, data);
    }

    public async delete(data: PartialRow<R>): Promise<void> {
        const conditionString = this.createConditionString(data);
        const sql = `DELETE FROM ${this.table} ${conditionString};`;
        return this.query(sql, data);
    }

    public abstract createTable(): Promise<void>;
}
