import { GuildChannel, User, Message, Guild } from 'discord.js';
import { Pool } from 'mariadb';
import * as fs from 'fs';

export interface MarkovChannelSchema {
    readonly frequency: number,
    readonly enabled: boolean,
    readonly guild_id: string,
    readonly channel_id: string
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

export class MarkovDatabase {

    private readonly frequency: number;
    private readonly pool: Pool;

    constructor(pool: Pool, frequency: number) {
        this.frequency = frequency;
        this.pool = pool;
    }

    public async fetchChannel(channel: GuildChannel): Promise<MarkovChannelSchema> {
        const query = { guild_id: channel.guild.id, channel_id: channel.id };
        const sql = 'SELECT * FROM markov_channel WHERE guild_id = :guild_id AND channel_id = :channel_id LIMIT 1';
        const rows = (await this.pool.query({ namedPlaceholders: true, sql: sql }, query));
        return rows.length ? rows[0] : {
            frequency: this.frequency,
            enabled: false,
            ...query
        }
    }

    public async setChannel(channel: GuildChannel, options: { enabled?: boolean, frequency?: number }): Promise<MarkovChannelSchema> {
        const existing = await this.fetchChannel(channel);
        const sql = 'REPLACE INTO markov_channel VALUES (:frequency, :enabled, :guild_id, :channel_id)';
        const data = {
            frequency: Math.abs(options.frequency ?? existing.frequency),
            enabled: options.enabled ?? existing.enabled,
            guild_id: channel.guild.id,
            channel_id: channel.id
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

    public async fetchStringsTotal(channel: GuildChannel, user?: User): Promise<number> {
        const query = { guild_id: channel.guild.id, channel_id: channel.id, user_id: user ? user.id : null };
        const sql = (user ?
            'SELECT COUNT(*) AS total FROM markov_string WHERE guild_id = :guild_id AND channel_id = :channel_id AND user_id = :user_id' :
            'SELECT COUNT(*) AS total FROM markov_string WHERE guild_id = :guild_id AND channel_id = :channel_id AND bot = false'
        )
        const rows = await this.pool.query({ namedPlaceholders: true, sql: sql }, query);
        return rows.length ? rows[0].total : 0;
    }

    public async fetchStrings(channel: GuildChannel, user?: User): Promise<Array<MarkovStringSchema>> {
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
        if (!existing.enabled) return;
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

    public async purge(guild: Guild) {
        await this.deleteStrings(guild);
        await this.deleteChannel(guild);
    }

    public async setup(): Promise<void> {
        return Promise.allSettled([
            this.pool.query(fs.readFileSync(`${__dirname}/schemas/markov_channel.sql`, 'utf8')),
            this.pool.query(fs.readFileSync(`${__dirname}/schemas/markov_string.sql`, 'utf8')),
        ]).then(ress => {
            return ress.forEach(res => {
                if (res.status === 'fulfilled') return;
                if (res.reason.code !== 'ER_TABLE_EXISTS_ERROR') throw res.reason;
            })
        })
    }
}
