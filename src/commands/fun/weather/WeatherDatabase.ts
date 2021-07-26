import { GeocodeData } from './api/OpenWeatherAPI';
import { Guild, GuildMember } from 'discord.js';
import { Pool, PoolConfig } from 'mariadb';
import * as MariaDB from 'mariadb';
import * as fs from 'fs';

export interface WeatherLinkSchema {
    readonly user_id: string,
    readonly guild_id: string,
    readonly name: string,
    readonly state: string,
    readonly country: string,
    readonly lat: number,
    readonly lon: number
}

export class WeatherDatabase {

    private readonly pool: Pool;

    constructor(poolConfig: PoolConfig) {
        this.pool = MariaDB.createPool(poolConfig);
    }

    public async fetchLink(member: GuildMember): Promise<WeatherLinkSchema | null> {
        const sql = 'SELECT * FROM weather_link WHERE user_id = :user_id AND guild_id = :guild_id LIMIT 1';
        const query = { user_id: member.user.id, guild_id: member.guild.id };
        const rows = await this.pool.query({ namedPlaceholders: true, sql: sql }, query);
        return rows.length ? rows[0] : null;
    }

    public async fetchAllLinks(guild?: Guild): Promise<Array<WeatherLinkSchema>> {
        const query = { guild_id: guild ? guild.id : -1 };
        const sql = 'SELECT * FROM weather_link WHERE guild_id = :guild_id';
        return this.pool.query({ namedPlaceholders: true, sql: sql }, query);
    }

    public async setLink(member: GuildMember, geocode: GeocodeData) {
        const query = { user_id: member.user.id, guild_id: member.guild.id, ...geocode, state: geocode.state ?? null};
        const sql = 'REPLACE INTO weather_link VALUES (:user_id, :guild_id, :name, :state, :country, :lat, :lon)';
        return this.pool.query({ namedPlaceholders: true, sql: sql }, query);
    }

    public async deleteLink(member: GuildMember): Promise<any> {
        const query = { user_id: member.user.id, guild_id: member.guild.id };
        const sql = 'DELETE FROM weather_link WHERE user_id = :user_id AND guild_id = :guild_id';
        return this.pool.query({ namedPlaceholders: true, sql: sql }, query);
    }

    public async setup(): Promise<void> {
        return Promise.allSettled([
            this.pool.query(fs.readFileSync(`${__dirname}/schemas/weather_link.sql`, 'utf8')),
        ]).then(ress => {
            return ress.forEach(res => {
                if (res.status === 'fulfilled') return;
                if (res.reason.code !== 'ER_TABLE_EXISTS_ERROR') throw res.reason;
            })
        })
    }
}