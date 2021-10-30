import { GuildChannel, User, Message, Guild } from 'discord.js';
import { HandlerClient } from '../../../discord/HandlerClient';
import * as fs from 'fs';

export interface MarkovChannelSchema {
    readonly guild_id: string,
    readonly channel_id: string,
    readonly minutes: number,
    readonly messages: number,
    readonly posting: boolean,
    readonly tracking: boolean,
    readonly links: boolean,
    readonly mentions: boolean,
    readonly owoify: boolean
}

export interface MarkovStringSchema {
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

    public static async fetchChannel(channel: GuildChannel): Promise<MarkovChannelSchema> {
        const client = channel.client as HandlerClient;
        const query = { guild_id: channel.guild.id, channel_id: channel.id };
        const sql = 'SELECT * FROM markov_channel WHERE guild_id = :guild_id AND channel_id = :channel_id LIMIT 1';
        const rows = await client.pool.query({ namedPlaceholders: true, sql: sql }, query);
        return rows.length ? rows[0] : {
            ...query,
            messages: MarkovDatabase.DEFAULT_MESSAGES,
            minutes: MarkovDatabase.DEAFULT_MINUTES,
            posting: false,
            tracking: false,
            mentions: false,
            links: false,
            owoify: false
        }
    }

    public static async fetchAllChannels(guild: Guild): Promise<Array<MarkovChannelSchema>> {
        const client = guild.client as HandlerClient;
        const query = { guild_id: guild.id };
        const sql = 'SELECT * FROM markov_channel WHERE guild_id = :guild_id';
        return client.pool.query({ namedPlaceholders: true, sql: sql }, query);
    }

    public static async setChannel(channel: GuildChannel, options: { messages?: number, minutes?: number, posting?: boolean, tracking?: boolean, links?: boolean, mentions?: boolean, owoify?: boolean }): Promise<MarkovChannelSchema> {
        const client = channel.client as HandlerClient;
        const existing = await MarkovDatabase.fetchChannel(channel);
        const sql = 'REPLACE INTO markov_channel VALUES (:guild_id, :channel_id, :minutes, :messages, :posting, :tracking, :links, :mentions, :owoify)';
        const data = {
            guild_id: channel.guild.id,
            channel_id: channel.id,
            minutes: Math.abs(options.minutes ?? existing.minutes),
            messages: Math.abs(options.messages ?? existing.messages),
            posting: options.posting ?? existing.posting,
            tracking: options.tracking ?? existing.tracking,
            links: options.links ?? existing.links,
            mentions: options.mentions ?? existing.mentions,
            owoify: options.owoify ?? existing.owoify
        }
        await client.pool.query({ namedPlaceholders: true, sql: sql }, data);
        return data;
    }

    public static async deleteChannel(scope: Guild | GuildChannel): Promise<any> {
        const client = scope.client as HandlerClient;
        if (scope instanceof GuildChannel) {
            const query = { guild_id: scope.guild.id, channel_id: scope.id };
            const sql = 'DELETE FROM markov_channel WHERE guild_id = :guild_id AND channel_id = :channel_id';
            return client.pool.query({ namedPlaceholders: true, sql: sql }, query);
        }
        if (scope instanceof Guild) {
            const query = { guild_id: scope.id };
            const sql = 'DELETE FROM markov_channel WHERE guild_id = :guild_id';
            return client.pool.query({ namedPlaceholders: true, sql: sql }, query);
        }
    }

    public static async fetchStringsTotals(channel: GuildChannel): Promise<MarkovStringTotals> {
        const client = channel.client as HandlerClient;
        const query = { guild_id: channel.guild.id, channel_id: channel.id };
        const sql_total_all = 'SELECT COUNT(*) AS total FROM markov_string WHERE guild_id = :guild_id AND channel_id = :channel_id'
        const sql_total_users = 'SELECT COUNT(*) AS total FROM markov_string WHERE guild_id = :guild_id AND channel_id = :channel_id AND bot = false';
        const total_all_rows = await client.pool.query({ namedPlaceholders: true, sql: sql_total_all }, query);
        const total_users_rows = await client.pool.query({ namedPlaceholders: true, sql: sql_total_users }, query);
        return {
            total: total_all_rows.length ? total_all_rows[0].total : 0,
            users: total_users_rows.length ? total_users_rows[0].total : 0
        }
    }

    public static async fetchStrings(channel: GuildChannel, user?: User): Promise<Array<MarkovStringSchema>> {
        const query = { guild_id: channel.guild.id, channel_id: channel.id, user_id: user ? user.id : null };
        const sql = (user ?
            'SELECT * FROM markov_string WHERE guild_id = :guild_id AND channel_id = :channel_id AND user_id = :user_id' :
            'SELECT * FROM markov_string WHERE guild_id = :guild_id AND channel_id = :channel_id AND bot = false'
        )
        return (channel.client as HandlerClient).pool.query({ namedPlaceholders: true, sql: sql }, query);
    }

    public static async setStrings(message: Message): Promise<void> {
        const client = message.client as HandlerClient;
        if (!message.guild || !message.content.length) return;
        const existing = await MarkovDatabase.fetchChannel(<GuildChannel>message.channel);
        if (!existing.tracking) return;
        const sql = 'REPLACE INTO markov_string VALUES (:epoch, :bot, :user_id, :guild_id, :channel_id, :message_id, :content)';
        return await client.pool.query({ namedPlaceholders: true, sql: sql }, {
            epoch: message.createdTimestamp,
            bot: message.author.bot,
            user_id: message.author.id,
            guild_id: message.guild.id,
            channel_id: message.channel.id,
            message_id: message.id,
            content: message.content
        });
    }

    public static async deleteStrings(scope: Guild | GuildChannel): Promise<void> {
        const client = scope.client as HandlerClient;
        if (scope instanceof GuildChannel) {
            const query = { guild_id: scope.guild.id, channel_id: scope.id }
            const sql = 'DELETE FROM markov_string WHERE guild_id = :guild_id AND channel_id = :channel_id';
            return await client.pool.query({ namedPlaceholders: true, sql: sql }, query)
        }
        if (scope instanceof Guild) {
            const query = { guild_id: scope.id }
            const sql = 'DELETE FROM markov_string WHERE guild_id = :guild_id';
            return await client.pool.query({ namedPlaceholders: true, sql: sql }, query)
        }
    }

    public static async hasData(guild: Guild): Promise<boolean> {
        const client = guild.client as HandlerClient;
        const query = { guild_id: guild.id };
        const stringSQL = 'SELECT COUNT(*) AS total FROM markov_string WHERE guild_id = :guild_id';
        const strings = await client.pool.query({ namedPlaceholders: true, sql: stringSQL }, query);
        if (strings.length && strings[0].total) return true;
        const channelSQL = 'SELECT COUNT(*) AS total FROM markov_channel WHERE guild_id = :guild_id';
        const channels = await client.pool.query({ namedPlaceholders: true, sql: channelSQL }, query);
        return channels.length ? Boolean(channels[0].total) : true;
    }

    public static async purge(guild: Guild) {
        await MarkovDatabase.deleteStrings(guild);
        await MarkovDatabase.deleteChannel(guild);
    }

    public static async setup(client: HandlerClient): Promise<void> {
        return Promise.allSettled([
            client.pool.query(fs.readFileSync(`${__dirname}/schemas/markov_channel.sql`, 'utf8')),
            client.pool.query(fs.readFileSync(`${__dirname}/schemas/markov_string.sql`, 'utf8')),
        ]).then(ress => {
            return ress.forEach(res => {
                if (res.status === 'fulfilled') return;
                if (res.reason.code !== 'ER_TABLE_EXISTS_ERROR') throw res.reason;
            })
        })
    }
}
