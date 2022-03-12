import { Pool } from 'mariadb';

export abstract class HandlerDatabase {

    protected readonly db: Pool;

    constructor(pool: Pool) {
        this.db = pool;
    }

    protected async select(sql: string, query?: any): Promise<any> {
        return this.db.query({ namedPlaceholders: true, sql: sql }, query);
    }

    protected async exec(sql: string, query?: any) {
        return this.db.query({ namedPlaceholders: true, sql: sql }, query);
    }

    public abstract createTables(): Promise<void>;
}
