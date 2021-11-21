import { HandlerDatabase, HandlerDB } from '../../../../helpers/HandlerDatabase.js';
import WeatherLinkRow from './interfaces/WeatherLinkRow.js';
import { Guild, GuildMember, User } from 'discord.js';
import { GeocodeData } from '../api/OpenWeatherAPI.js';
import path from 'path';
import fs from 'fs';

export { WeatherLinkRow };

export class WeatherDatabase extends HandlerDatabase {

    constructor(db: HandlerDB) {
        super({ db: db });
    }

    public async fetchLink(member: GuildMember): Promise<WeatherLinkRow | null> {
        const sql = 'SELECT * FROM weather_link WHERE user_id = :user_id AND guild_id = :guild_id LIMIT 1';
        const query = { user_id: member.user.id, guild_id: member.guild.id };
        const rows = await this.select(sql, query);
        return rows.length ? rows[0] : null;
    }

    public async fetchAllLinks(scope: Guild | User): Promise<WeatherLinkRow[]> {
        const query = { guild_id: scope instanceof Guild ? scope.id : -1 };
        const sql = 'SELECT * FROM weather_link WHERE guild_id = :guild_id';
        const res = this.select(sql, query);
        return res;
    }

    public async setLink(member: GuildMember, geocode: GeocodeData) {
        const query = { user_id: member.user.id, guild_id: member.guild.id, ...geocode, state: geocode.state ?? null};
        const sql = 'REPLACE INTO weather_link VALUES (:user_id, :guild_id, :name, :state, :country, :lat, :lon)';
        return this.exec(sql, query);
    }

    public async deleteLink(member: GuildMember): Promise<any> {
        const query = { user_id: member.user.id, guild_id: member.guild.id };
        const sql = 'DELETE FROM weather_link WHERE user_id = :user_id AND guild_id = :guild_id';
        return this.exec(sql, query);
    }

    public override async createTables(): Promise<void> {
        return Promise.allSettled([
            this.exec(fs.readFileSync(`${path.resolve()}/res/schemas/weather_link.sql`, 'utf8'))
        ]).then(ress => {
            return ress.forEach(res => {
                if (res.status === 'fulfilled') return;
                if (res.reason.code !== 'ER_TABLE_EXISTS_ERROR') throw res.reason;
            })
        })
    }
}
