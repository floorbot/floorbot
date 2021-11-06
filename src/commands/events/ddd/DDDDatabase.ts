import { Guild, Role, GuildMember, TextChannel } from 'discord.js';
import { Pool } from 'mariadb';
import * as fs from 'fs';

export interface DDDSettingsRow {
    readonly guild_id: string,
    readonly channel_id?: string,
    readonly role_id?: string
}

export interface DDDMemberRow {
    readonly guild_id: string,
    readonly user_id: string,
    readonly timezone: string
}

export interface DDDNutRow {
    readonly guild_id: string,
    readonly user_id: string,
    readonly epoch: string,
    readonly description?: string
}

export class DDDDatabase {

    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    public async setSettings(guild: Guild, options: { channel?: TextChannel, role?: Role }): Promise<DDDSettingsRow> {
        const existing = await this.fetchSettings(guild);
        const sql = 'REPLACE INTO ddd_settings VALUES (:guild_id, :channel_id, :role_id)';
        const data = {
            guild_id: guild.id,
            channel_id: options.channel ? options.channel.id : existing.channel_id,
            role_id: options.role ? options.role.id : existing.role_id,
        };
        await this.pool.query({ namedPlaceholders: true, sql: sql }, data);
        return data;
    }

    public async fetchSettings(guild: Guild): Promise<DDDSettingsRow> {
        const sql = 'SELECT * FROM ddd_settings WHERE guild_id = :guild_id LIMIT 1;';
        const data = { guild_id: guild.id };
        const rows = await this.pool.query({ namedPlaceholders: true, sql: sql }, data);
        return rows.length ? rows[0] : { ...data, channel_id: null, role_id: null }
    }

    public async setMember(member: GuildMember, timezone: string): Promise<DDDMemberRow> {
        const sql = 'REPLACE INTO ddd_member VALUES (:guild_id, :user_id, :timezone)';
        const data = { guild_id: member.guild.id, user_id: member.id, timezone: timezone };
        await this.pool.query({ namedPlaceholders: true, sql: sql }, data);
        return data;
    }

    public async fetchMember(member: GuildMember): Promise<DDDMemberRow | null> {
        const sql = 'SELECT * FROM ddd_member WHERE guild_id = :guild_id AND user_id = :user_id LIMIT 1;';
        const data = { guild_id: member.guild.id, user_id: member.id };
        const rows = await this.pool.query({ namedPlaceholders: true, sql: sql }, data);
        return rows.length ? rows[0] : null;
    }

    public async fetchAllMembers(guild: Guild): Promise<DDDMemberRow[]> {
        const sql = 'SELECT * FROM ddd_member WHERE guild_id = :guild_id;';
        const data = { guild_id: guild.id };
        return await this.pool.query({ namedPlaceholders: true, sql: sql }, data);
    }

    public async setNut(member: GuildMember, epoch: string, description?: string): Promise<DDDNutRow> {
        const sql = 'REPLACE INTO ddd_nut VALUES (:guild_id, :user_id, :epoch, :description)';
        const data = { guild_id: member.guild.id, user_id: member.id, epoch: epoch, description: description };
        await this.pool.query({ namedPlaceholders: true, sql: sql }, data);
        return data;
    }

    public async fetchAllNuts(scope: Guild | GuildMember): Promise<DDDNutRow[]> {
        const guild = scope instanceof Guild ? scope : scope.guild;
        const member = scope instanceof GuildMember ? scope : null;
        const sql = (scope instanceof Guild ?
            'SELECT * FROM ddd_nut WHERE guild_id = :guild_id;' :
            'SELECT * FROM ddd_nut WHERE guild_id = :guild_id AND user_id = :user_id;'
        );
        const data = { guild_id: guild.id, user_id: member ? member.id : null };
        return await this.pool.query({ namedPlaceholders: true, sql: sql }, data);
    }

    public async createTables(): Promise<void> {
        return Promise.allSettled([
            this.pool.query(fs.readFileSync(`${__dirname}/schemas/ddd_settings.sql`, 'utf8')),
            this.pool.query(fs.readFileSync(`${__dirname}/schemas/ddd_member.sql`, 'utf8')),
            this.pool.query(fs.readFileSync(`${__dirname}/schemas/ddd_nut.sql`, 'utf8'))
        ]).then(ress => {
            return ress.forEach(res => {
                if (res.status === 'fulfilled') return;
                if (res.reason.code !== 'ER_TABLE_EXISTS_ERROR') throw res.reason;
            })
        })
    }
}
