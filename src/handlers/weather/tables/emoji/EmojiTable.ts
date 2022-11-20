import { Client, Collection, GuildEmoji } from 'discord.js';
import fs from 'fs';
import { Pool } from 'mariadb';
import path from 'path';
import { MariaDBTable } from '../../../../core/MariaDBTable.js';

export interface EmojiRow {
    readonly name: string,
    readonly emoji_name: string,
    readonly emoji_id: string,
    readonly animated: boolean,
}

export class EmojiTable extends MariaDBTable<EmojiRow, Pick<EmojiRow, 'name'>> {

    protected readonly emojis: Collection<string, EmojiRow>;

    constructor(pool: Pool) {
        super(pool, 'emoji');
        this.emojis = new Collection();
        this.refreshCache();
    }

    public getEmoji(name: string, client?: Client): string | null {
        const emojiRow = this.emojis.get(name);
        if (emojiRow) {
            if (client) {
                const cached = client.emojis.cache.get(emojiRow.emoji_id);
                if (cached) return cached.toString();
            }
            return `<${emojiRow.animated ? 'a' : ''}:${emojiRow.name}:${emojiRow.emoji_id}>`;
        };
        return null;
    }

    public async refreshCache(): Promise<Collection<string, EmojiRow>> {
        await this.createTable();
        const emojis = await this.selectAll();
        for (const emoji of emojis) { this.emojis.set(emoji.name, emoji); }
        return this.emojis.clone();
    }

    public async selectEmoji(name: string): Promise<EmojiRow | null> {
        const emoji = await this.select({ name });
        return emoji[0] || null;
    }

    public async insertEmoji(name: string, emoji: GuildEmoji): Promise<void> {
        return this.insert({
            name: name,
            emoji_name: emoji.name ?? '',
            emoji_id: emoji.id,
            animated: emoji.animated ?? false
        });
    }

    public async deleteEmoji(name: string): Promise<void> {
        return this.delete({ name: name });
    }

    public async createTable(): Promise<void> {
        const sql = fs.readFileSync(`${path.resolve()}/res/schemas/${this.table}.sql`, 'utf8');
        return this.query(sql).catch(error => {
            if (error.code !== 'ER_TABLE_EXISTS_ERROR') throw error.reason;
        });
    }
}
