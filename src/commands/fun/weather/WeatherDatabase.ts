import { HandlerClient } from '../../../discord/HandlerClient';
import { Guild, GuildMember, User } from 'discord.js';
import { GeocodeData } from './api/OpenWeatherAPI';
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

    public static async fetchLink(member: GuildMember): Promise<WeatherLinkSchema | null> {
        const client = member.client as HandlerClient;
        const sql = 'SELECT * FROM weather_link WHERE user_id = :user_id AND guild_id = :guild_id LIMIT 1';
        const query = { user_id: member.user.id, guild_id: member.guild.id };
        const rows = await client.pool.query({ namedPlaceholders: true, sql: sql }, query);
        return rows.length ? rows[0] : null;
    }

    public static async fetchAllLinks(scope: Guild | User): Promise<WeatherLinkSchema[]> {
        const client = scope.client as HandlerClient;
        const query = { guild_id: scope instanceof Guild ? scope.id : -1 };
        const sql = 'SELECT * FROM weather_link WHERE guild_id = :guild_id';
        return client.pool.query({ namedPlaceholders: true, sql: sql }, query);
    }

    public static async setLink(member: GuildMember, geocode: GeocodeData) {
        const client = member.client as HandlerClient;
        const query = { user_id: member.user.id, guild_id: member.guild.id, ...geocode, state: geocode.state ?? null};
        const sql = 'REPLACE INTO weather_link VALUES (:user_id, :guild_id, :name, :state, :country, :lat, :lon)';
        return client.pool.query({ namedPlaceholders: true, sql: sql }, query);
    }

    public static async deleteLink(member: GuildMember): Promise<any> {
        const client = member.client as HandlerClient;
        const query = { user_id: member.user.id, guild_id: member.guild.id };
        const sql = 'DELETE FROM weather_link WHERE user_id = :user_id AND guild_id = :guild_id';
        return client.pool.query({ namedPlaceholders: true, sql: sql }, query);
    }

    public static async setup(client: HandlerClient): Promise<void> {
        return Promise.allSettled([
            client.pool.query(fs.readFileSync(`${__dirname}/schemas/weather_link.sql`, 'utf8')),
        ]).then(ress => {
            return ress.forEach(res => {
                if (res.status === 'fulfilled') return;
                if (res.reason.code !== 'ER_TABLE_EXISTS_ERROR') throw res.reason;
            })
        })
    }
}
