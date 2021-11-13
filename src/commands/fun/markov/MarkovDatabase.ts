import { GuildChannel, User, Message, Guild } from 'discord.js';
import { Pool } from 'mariadb';
import * as fs from 'fs';
import path from 'path';

export interface MarkovChannelRow {
    readonly guild_id: string,
    readonly channel_id: string,
    readonly minutes: number,
    readonly messages: number,
    readonly posting: boolean,
    readonly tracking: boolean,
    readonly links: boolean,
    readonly mentions: boolean,
    readonly owoify: boolean,
    readonly quoting: boolean
}

export interface MarkovStringRow {
    readonly epoch: string,
    readonly bot: boolean,
    readonly user_id: string,
    readonly guild_id: string,
    readonly channel_id: string,
    readonly message_id: string,
    readonly content: string
}

export interface MarkovStringTotals {
    total: number,
    users: number
}

export class MarkovDatabase {

    private static readonly DEFAULT_MESSAGES = 50;
    private static readonly DEAFULT_MINUTES = 100;

    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }
    public async fetchChannel(channel: GuildChannel): Promise<MarkovChannelRow> {
        const query = { guild_id: channel.guild.id, channel_id: channel.id };
        const sql = 'SELECT * FROM markov_channel WHERE guild_id = :guild_id AND channel_id = :channel_id LIMIT 1';
        const rows = await this.pool.query({ namedPlaceholders: true, sql: sql }, query);
        return rows.length ? rows[0] : {
            ...query,
            messages: MarkovDatabase.DEFAULT_MESSAGES,
            minutes: MarkovDatabase.DEAFULT_MINUTES,
            posting: false,
            tracking: false,
            mentions: false,
            links: false,
            owoify: false,
            quoting: true
        }
    }

    public async fetchAllChannels(guild: Guild): Promise<Array<MarkovChannelRow>> {
        const query = { guild_id: guild.id };
        const sql = 'SELECT * FROM markov_channel WHERE guild_id = :guild_id';
        return this.pool.query({ namedPlaceholders: true, sql: sql }, query);
    }

    public async setChannel(channel: GuildChannel, options: { messages?: number, minutes?: number, posting?: boolean, tracking?: boolean, links?: boolean, mentions?: boolean, owoify?: boolean, quoting?: boolean }): Promise<MarkovChannelRow> {
        const existing = await this.fetchChannel(channel);
        const sql = 'REPLACE INTO markov_channel VALUES (:guild_id, :channel_id, :minutes, :messages, :posting, :tracking, :links, :mentions, :owoify, :quoting)';
        const data = {
            guild_id: channel.guild.id,
            channel_id: channel.id,
            minutes: Math.abs(options.minutes ?? existing.minutes),
            messages: Math.abs(options.messages ?? existing.messages),
            posting: options.posting ?? existing.posting,
            tracking: options.tracking ?? existing.tracking,
            links: options.links ?? existing.links,
            mentions: options.mentions ?? existing.mentions,
            owoify: options.owoify ?? existing.owoify,
            quoting: options.quoting ?? existing.quoting
        }
        await this.pool.query({ namedPlaceholders: true, sql: sql }, data);
        return data;
    }

    public async deleteChannel(scope: Guild | GuildChannel): Promise<any> {
        if (scope instanceof GuildChannel) {
            const query = { guild_id: scope.guild.id, channel_id: scope.id };
            const sql = 'DELETE FROM markov_channel WHERE guild_id = :guild_id AND channel_id = :channel_id';
            return this.pool.query({ namedPlaceholders: true, sql: sql }, query);
        }
        if (scope instanceof Guild) {
            const query = { guild_id: scope.id };
            const sql = 'DELETE FROM markov_channel WHERE guild_id = :guild_id';
            return this.pool.query({ namedPlaceholders: true, sql: sql }, query);
        }
    }

    public async fetchStringsTotals(channel: GuildChannel): Promise<MarkovStringTotals> {
        const query = { guild_id: channel.guild.id, channel_id: channel.id };
        const sql_total_all = 'SELECT COUNT(*) AS total FROM markov_string WHERE guild_id = :guild_id AND channel_id = :channel_id'
        const sql_total_users = 'SELECT COUNT(*) AS total FROM markov_string WHERE guild_id = :guild_id AND channel_id = :channel_id AND bot = false';
        const total_all_rows = await this.pool.query({ namedPlaceholders: true, sql: sql_total_all }, query);
        const total_users_rows = await this.pool.query({ namedPlaceholders: true, sql: sql_total_users }, query);
        return {
            total: total_all_rows.length ? total_all_rows[0].total : 0,
            users: total_users_rows.length ? total_users_rows[0].total : 0
        }
    }

    public async fetchStrings(channel: GuildChannel, user?: User): Promise<Array<MarkovStringRow>> {
        const query = { guild_id: channel.guild.id, channel_id: channel.id, user_id: user ? user.id : null };
        const sql = (user ?
            'SELECT * FROM markov_string WHERE guild_id = :guild_id AND channel_id = :channel_id AND user_id = :user_id' :
            'SELECT * FROM markov_string WHERE guild_id = :guild_id AND channel_id = :channel_id AND bot = false'
        )
        return this.pool.query({ namedPlaceholders: true, sql: sql }, query);
    }

    public async setStrings(message: Message): Promise<void> {
        if (!message.guild || !message.content.length) return;
        const existing = await this.fetchChannel(<GuildChannel>message.channel);
        if (!existing.tracking) return;
        const sql = 'REPLACE INTO markov_string VALUES (:epoch, :bot, :user_id, :guild_id, :channel_id, :message_id, :content)';
        return await this.pool.query({ namedPlaceholders: true, sql: sql }, {
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
        if (scope instanceof GuildChannel) {
            const query = { guild_id: scope.guild.id, channel_id: scope.id }
            const sql = 'DELETE FROM markov_string WHERE guild_id = :guild_id AND channel_id = :channel_id';
            return await this.pool.query({ namedPlaceholders: true, sql: sql }, query)
        }
        if (scope instanceof Guild) {
            const query = { guild_id: scope.id }
            const sql = 'DELETE FROM markov_string WHERE guild_id = :guild_id';
            return await this.pool.query({ namedPlaceholders: true, sql: sql }, query)
        }
    }

    public async hasData(guild: Guild): Promise<boolean> {
        const query = { guild_id: guild.id };
        const stringSQL = 'SELECT COUNT(*) AS total FROM markov_string WHERE guild_id = :guild_id';
        const strings = await this.pool.query({ namedPlaceholders: true, sql: stringSQL }, query);
        if (strings.length && strings[0].total) return true;
        const channelSQL = 'SELECT COUNT(*) AS total FROM markov_channel WHERE guild_id = :guild_id';
        const channels = await this.pool.query({ namedPlaceholders: true, sql: channelSQL }, query);
        return channels.length ? Boolean(channels[0].total) : true;
    }

    public async purge(guild: Guild): Promise<void> {
        await this.deleteStrings(guild);
        await this.deleteChannel(guild);
    }

    public async createTables(): Promise<void> {
        return Promise.allSettled([
            this.pool.query(fs.readFileSync(`${path.resolve()}/res/schemas/markov_channel.sql`, 'utf8')),
            this.pool.query(fs.readFileSync(`${path.resolve()}/res/schemas/markov_string.sql`, 'utf8')),
        ]).then(ress => {
            return ress.forEach(res => {
                if (res.status === 'fulfilled') return;
                if (res.reason.code !== 'ER_TABLE_EXISTS_ERROR') throw res.reason;
            })
        })
    }
}
