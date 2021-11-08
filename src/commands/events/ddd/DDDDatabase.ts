import { Guild, Role, GuildMember, TextChannel } from 'discord.js';
import { Pool } from 'mariadb';
import * as fs from 'fs';

export interface DDDSettingsRow {
    readonly guild_id: string,
    readonly channel_id: string | null,
    readonly role_id: string | null
}

export interface DDDMemberRow {
    readonly guild_id: string,
    readonly user_id: string,
    readonly season: number,
    readonly timezone: string
}

export interface DDDNutRow {
    readonly guild_id: string,
    readonly user_id: string,
    readonly epoch: string,
    readonly season: number,
    readonly description?: string | null
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
            channel_id: options.channel ? options.channel.id : ('channel' in options ? null : existing.channel_id),
            role_id: options.role ? options.role.id : ('role' in options ? null : existing.role_id),
        };
        await this.pool.query({ namedPlaceholders: true, sql: sql }, data);
        return data;
    }

    public async fetchSettings(guild: Guild | string): Promise<DDDSettingsRow> {
        const sql = 'SELECT * FROM ddd_settings WHERE guild_id = :guild_id LIMIT 1;';
        const data = { guild_id: guild instanceof Guild ? guild.id : guild };
        const rows = await this.pool.query({ namedPlaceholders: true, sql: sql }, data);
        return rows.length ? rows[0] : { ...data, channel_id: null, role_id: null }
    }

    public async setMember(member: GuildMember, season: number, timezone: string): Promise<DDDMemberRow> {
        const sql = 'REPLACE INTO ddd_member VALUES (:guild_id, :user_id, :season, :timezone)';
        const data = { guild_id: member.guild.id, user_id: member.id, season: season, timezone: timezone };
        await this.pool.query({ namedPlaceholders: true, sql: sql }, data);
        return data;
    }

    public async deleteMember(member: GuildMember): Promise<void> {
        const sql = 'DELETE FROM ddd_member WHERE guild_id = :guild_id AND user_id = :user_id;';
        const data = { guild_id: member.guild.id, user_id: member.id };
        await this.pool.query({ namedPlaceholders: true, sql: sql }, data);
    }

    public async fetchMember(member: GuildMember, season: number): Promise<DDDMemberRow | null> {
        const sql = 'SELECT * FROM ddd_member WHERE guild_id = :guild_id AND user_id = :user_id AND season = :season LIMIT 1;';
        const data = { guild_id: member.guild.id, user_id: member.id, season: season };
        const rows = await this.pool.query({ namedPlaceholders: true, sql: sql }, data);
        return rows.length ? rows[0] : null;
    }

    public async fetchAllMembers(scope: Guild | number): Promise<DDDMemberRow[]> {
        const sql = (scope instanceof Guild ?
            'SELECT * FROM ddd_member WHERE guild_id = :guild_id;' :
            'SELECT * FROM ddd_member WHERE season = :season;'
        );
        const data = { guild_id: scope instanceof Guild ? scope.id : null, season: scope };
        return await this.pool.query({ namedPlaceholders: true, sql: sql }, data);
    }

    public async setNut(member: GuildMember, epoch: string, season: number, description?: string): Promise<DDDNutRow> {
        const sql = 'REPLACE INTO ddd_nut VALUES (:guild_id, :user_id, :epoch, :season, :description)';
        const data = { guild_id: member.guild.id, user_id: member.id, epoch: epoch, season: season, description: description || null };
        await this.pool.query({ namedPlaceholders: true, sql: sql }, data);
        return data;
    }

    public async fetchAllNuts(scope: Guild | GuildMember | DDDMemberRow, season: number): Promise<DDDNutRow[]> {
        const guild_id = scope instanceof Guild ? scope.id : scope instanceof GuildMember ? scope.guild.id : scope.guild_id;
        const user_id = scope instanceof GuildMember ? scope.id : scope instanceof Guild ? null : scope.user_id;
        const sql = (scope instanceof Guild ?
            'SELECT * FROM ddd_nut WHERE guild_id = :guild_id AND season = :season;' :
            'SELECT * FROM ddd_nut WHERE guild_id = :guild_id AND user_id = :user_id AND season = :season;'
        );
        const data = { guild_id: guild_id, user_id: user_id, season: season };
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
