import { BooruPostData } from '../builders/BooruReplyBuilder.js';
import { MariaDBTable } from '../../../lib/MariaDBTable.js';
import { User } from 'discord.js';
import { Pool } from 'mariadb';
import path from 'path';
import fs from 'fs';

export interface BooruRow {
    readonly user_id: string;
    readonly image_url: string;
    readonly post_url: string;
    readonly api_name: string;
    readonly api_icon_url: string;
}

export class BooruTable extends MariaDBTable<BooruRow, Pick<BooruRow, 'user_id' | 'image_url'>>  {

    constructor(pool: Pool) {
        super(pool, 'booru');
    }

    public async selectBoorus(user: User): Promise<BooruRow[]> {
        return super.select({ user_id: user.id });
    }

    public async insertBooru(user: User, booru: BooruPostData): Promise<void> {
        return super.insert({
            user_id: user.id,
            image_url: booru.imageURL,
            post_url: booru.postURL,
            api_name: booru.apiName,
            api_icon_url: booru.apiIconURL
        });
    }

    public async deleteBooru(user: User, imageURL?: string): Promise<void> {
        return super.delete({
            user_id: user.id,
            ...(imageURL && { image_url: imageURL })
        });
    }

    public async createTable(): Promise<void> {
        const sql = fs.readFileSync(`${path.resolve()}/res/schemas/booru.sql`, 'utf8');
        return this.query(sql).catch(error => {
            if (error.code !== 'ER_TABLE_EXISTS_ERROR') throw error.reason;
        });
    }
}
