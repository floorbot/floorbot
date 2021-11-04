import { Guild, Role, GuildMember, TextChannel } from 'discord.js';
import { HandlerClient } from '../../../discord/HandlerClient';
import * as fs from 'fs';

export interface DDDSettingsSchema {
    readonly guild_id: string,
    readonly channel_id?: string,
    readonly role_id?: string
}

export interface DDDMemberSchema {
    readonly guild_id: string,
    readonly user_id: string,
    readonly timezone: string
}

export interface DDDNutSchema {
    readonly guild_id: string,
    readonly user_id: string,
    readonly epoch: string,
    readonly description?: string
}

export class DDDDatabase {

    public static async setSettings(guild: Guild, options: { channel?: TextChannel, role?: Role }): Promise<DDDSettingsSchema> {
        const client = guild.client as HandlerClient;
        const existing = await DDDDatabase.fetchSettings(guild);
        const sql = 'REPLACE INTO ddd_settings VALUES (:guild_id, :channel_id, :role_id)';
        const data = {
            guild_id: guild.id,
            channel_id: options.channel ? options.channel.id : existing.channel_id,
            role_id: options.role ? options.role.id : existing.role_id,
        };
        await client.pool.query({ namedPlaceholders: true, sql: sql }, data);
        return data;
    }

    public static async fetchSettings(guild: Guild): Promise<DDDSettingsSchema> {
        const client = guild.client as HandlerClient;
        const sql = 'SELECT * FROM ddd_settings WHERE guild_id = :guild_id LIMIT 1;';
        const data = { guild_id: guild.id };
        const rows = await client.pool.query({ namedPlaceholders: true, sql: sql }, data);
        return rows.length ? rows[0] : { ...data, channel_id: null, role_id: null }
    }

    public static async setMember(member: GuildMember, timezone: string): Promise<DDDMemberSchema> {
        const client = member.client as HandlerClient;
        const sql = 'REPLACE INTO ddd_member VALUES (:guild_id, :user_id, :timezone)';
        const data = { guild_id: member.guild.id, user_id: member.id, timezone: timezone };
        await client.pool.query({ namedPlaceholders: true, sql: sql }, data);
        return data;
    }

    public static async fetchMember(member: GuildMember): Promise<DDDMemberSchema | null> {
        const client = member.client as HandlerClient;
        const sql = 'SELECT * FROM ddd_member WHERE guild_id = :guild_id AND user_id = :user_id LIMIT 1;';
        const data = { guild_id: member.guild.id, user_id: member.id };
        const rows = await client.pool.query({ namedPlaceholders: true, sql: sql }, data);
        return rows.length ? rows[0] : null;
    }

    public static async fetchAllMembers(guild: Guild): Promise<DDDMemberSchema[]> {
        const client = guild.client as HandlerClient;
        const sql = 'SELECT * FROM ddd_member WHERE guild_id = :guild_id;';
        const data = { guild_id: guild.id };
        return await client.pool.query({ namedPlaceholders: true, sql: sql }, data);
    }

    public static async setNut(member: GuildMember, epoch: string, description?: string): Promise<DDDNutSchema> {
        const client = member.client as HandlerClient;
        const sql = 'REPLACE INTO ddd_nut VALUES (:guild_id, :user_id, :epoch, :description)';
        const data = { guild_id: member.guild.id, user_id: member.id, epoch: epoch, description: description };
        await client.pool.query({ namedPlaceholders: true, sql: sql }, data);
        return data;
    }

    public static async fetchAllNuts(scope: Guild | GuildMember): Promise<DDDNutSchema[]> {
        const guild = scope instanceof Guild ? scope : scope.guild;
        const member = scope instanceof GuildMember ? scope : null;
        const client = scope.client as HandlerClient;
        const sql = (scope instanceof Guild ?
            'SELECT * FROM ddd_nut WHERE guild_id = :guild_id;' :
            'SELECT * FROM ddd_nut WHERE guild_id = :guild_id AND user_id = :user_id;'
        );
        const data = { guild_id: guild.id, user_id: member ? member.id : null };
        return await client.pool.query({ namedPlaceholders: true, sql: sql }, data);
    }

    public static async setup(client: HandlerClient): Promise<void> {
        return Promise.allSettled([
            client.pool.query(fs.readFileSync(`${__dirname}/schemas/ddd_settings.sql`, 'utf8')),
            client.pool.query(fs.readFileSync(`${__dirname}/schemas/ddd_member.sql`, 'utf8')),
            client.pool.query(fs.readFileSync(`${__dirname}/schemas/ddd_nut.sql`, 'utf8'))
        ]).then(ress => {
            return ress.forEach(res => {
                if (res.status === 'fulfilled') return;
                if (res.reason.code !== 'ER_TABLE_EXISTS_ERROR') throw res.reason;
            })
        })
    }
}
