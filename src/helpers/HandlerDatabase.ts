import { Database } from 'better-sqlite3';
import { Pool } from 'mariadb';

export type HandlerDB = Pool | Database;

export interface HandlerDatabaseConstructorOptions {
    readonly db: HandlerDB;
}

export abstract class HandlerDatabase {

    protected readonly db: HandlerDB;

    constructor(options: HandlerDatabaseConstructorOptions) {
        this.db = options.db
    }

    protected async select(sql: string, query?: any): Promise<any> {
        if ('query' in this.db) return this.db.query({ namedPlaceholders: true, sql: sql }, query);
        else {
            const stmt = this.db.prepare(sql).safeIntegers(true)
            return query ? stmt.all(query) : stmt.run();
        }
    }

    protected async exec(sql: string, query?: any) {
        if ('query' in this.db) return this.db.query({ namedPlaceholders: true, sql: sql }, query);
        else {
            const stmt = this.db.prepare(sql).safeIntegers(true);
            return query ? stmt.run(query) : stmt.run();
        }
    }

    public abstract createTables(): Promise<void>;
}
