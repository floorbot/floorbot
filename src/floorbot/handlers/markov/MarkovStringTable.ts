import { MariaDBTable } from '../../../discord/MariaDBTable.js';
import { Guild, GuildChannel, Message, User } from 'discord.js';
import { Pool } from 'mariadb';
import path from 'path';
import fs from 'fs';

export interface MarkovStringRow {
    readonly epoch: number,
    readonly bot: boolean,
    readonly user_id: string,
    readonly guild_id: string,
    readonly channel_id: string,
    readonly message_id: string,
    readonly content: string;
}

export interface MarkovStringTotals {
    total: number,
    users: number;
}

export class MarkovStringTable extends MariaDBTable<MarkovStringRow, Pick<MarkovStringRow, 'channel_id' | 'message_id'>> {

    constructor(pool: Pool) {
        super(pool, 'markov_string');
    }

    public async selectStrings(channel: GuildChannel, user?: User): Promise<MarkovStringRow[]> {
        const query = { guild_id: channel.guild.id, channel_id: channel.id, ...user && { user_id: user.id }, };
        return this.select(query);
    }

    public async insertString(message: Message): Promise<void> {
        if (!message.guild || !message.content.length) return;
        return await this.insert({
            epoch: message.createdTimestamp,
            bot: message.author.bot,
            user_id: message.author.id,
            guild_id: message.guild.id,
            channel_id: message.channel.id,
            message_id: message.id,
            content: message.content
        });
    }

    public async deleteStrings(scope: Guild | GuildChannel): Promise<void> {
        if (scope instanceof GuildChannel) return this.delete({ guild_id: scope.guild.id, channel_id: scope.id });
        if (scope instanceof Guild) return this.delete({ guild_id: scope.id });
    }

    public async selectTotalStrings(scope: Guild | GuildChannel): Promise<number> {
        if (scope instanceof Guild) {
            const sql = 'SELECT COUNT(*) AS total FROM markov_string WHERE guild_id = :guild_id';
            const rows = await this.query(sql, { guild_id: scope.id });
            return rows[0] ? rows[0].total : 0;
        } else {
            const sql = 'SELECT COUNT(*) AS total FROM markov_string WHERE guild_id = :guild_id';
            const rows = await this.query(sql, { guild_id: scope.guild.id, channel_id: scope.id });
            return rows[0] ? rows[0].total : 0;
        }
    }

    public async selectStringsTotals(channel: GuildChannel): Promise<MarkovStringTotals> {
        const query = { guild_id: channel.guild.id, channel_id: channel.id };
        const sql_total_all = 'SELECT COUNT(*) AS total FROM markov_string WHERE guild_id = :guild_id AND channel_id = :channel_id';
        const sql_total_users = 'SELECT COUNT(*) AS total FROM markov_string WHERE guild_id = :guild_id AND channel_id = :channel_id AND bot = false';
        const total_all_rows = await this.query(sql_total_all, query);
        const total_users_rows = await this.query(sql_total_users, query);
        return {
            total: total_all_rows.length ? total_all_rows[0].total : 0,
            users: total_users_rows.length ? total_users_rows[0].total : 0
        };
    }

    public async createTable(): Promise<void> {
        const sql = fs.readFileSync(`${path.resolve()}/res/schemas/markov_string.sql`, 'utf8');
        return this.query(sql).catch(error => {
            if (error.code !== 'ER_TABLE_EXISTS_ERROR') throw error.reason;
        });
    }
}
