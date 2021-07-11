import { LocationData, LatLonData } from '../api/OpenWeatherAPI';
import { User, Guild } from 'discord.js';
import { Pool } from 'mariadb';
import * as fs from 'fs';

export class WeatherDatabase {

    public static async fetchLinked(pool: Pool, user: User, guild?: Guild): Promise<WeatherDatabaseRow | null> {
        const sql = 'SELECT * FROM weather_linked WHERE user_id = ? AND guild_id = ? LIMIT 1;';
        const rows: Array<WeatherDatabaseRow> = await pool.query(sql, [user.id, guild ? guild.id : -1]);
        return rows.length ? rows[0] : null;
    }

    public static async fetchAllLinked(pool: Pool, guild?: Guild): Promise<Array<WeatherDatabaseRow>> {
        const sql = 'SELECT * FROM weather_linked WHERE guild_id = ?';
        return await pool.query(sql, [guild ? guild.id : -1]);
    }

    public static async setLinked(pool: Pool, data: WeatherDatabaseRow) {
        const sql = 'REPLACE INTO weather_linked VALUES (?, ?, ?, ?, ?, ?, ?)';
        return await pool.query(sql, [
            data.user_id,
            data.guild_id || -1,
            data.city_name,
            data.state_code || null,
            data.country_code,
            data.lat,
            data.lon
        ]);
    }

    public static async clearLinked(pool: Pool, user: User, guild?: Guild) {
        const sql = 'DELETE FROM weather_linked WHERE user_id = ? AND guild_id = ?';
        return await pool.query(sql, [user.id, guild ? guild.id : -1]);
    }

    public static async createTable(pool: Pool) {
        return pool.query(fs.readFileSync(`${__dirname}/weather_linked_table.sql`, 'utf8')).catch((error) => {
            if (error.code !== 'ER_TABLE_EXISTS_ERROR') throw error;
        });
    }
}

export interface WeatherDatabaseRow extends LocationData, LatLonData {
    readonly user_id: string,
    readonly guild_id: string
}
