
import { Guild, GuildMember, User } from "discord.js";
import fs from 'fs';
import { Pool } from "mariadb";
import path from 'path';
import { GeocodeData } from '../../../api/apis/open_weather/OpenWeatherAPI.js';
import { MariaDBTable } from '../../../core/MariaDBTable.js';

export default interface WeatherLinkRow {
    readonly user_id: string,
    readonly guild_id: string | null,
    readonly name: string,
    readonly state: string,
    readonly country: string,
    readonly lat: number,
    readonly lon: number;
}

export class WeatherLinkTable extends MariaDBTable<WeatherLinkRow, Pick<WeatherLinkRow, 'user_id' | 'guild_id'>> {

    constructor(pool: Pool) {
        super(pool, 'weather_link');
    }

    public async selectLink(user: User, guild?: Guild | null): Promise<WeatherLinkRow | null> {
        const link = await this.select({ user_id: user.id, guild_id: guild?.id ?? '' });
        return link[0] || null;
    }

    public async selectLinks(scope: User | GuildMember | Guild): Promise<WeatherLinkRow[]> {
        if (scope instanceof GuildMember) return this.select({ user_id: scope.id, guild_id: scope.guild.id });
        else if (scope instanceof Guild) return this.select({ guild_id: scope.id });
        else return this.select({ user_id: scope.id, guild_id: '' });
    }

    public async insertLink(user: User, geocode: GeocodeData, guild?: Guild | null): Promise<void> {
        return this.insert({
            user_id: user.id,
            guild_id: guild ? guild.id : '',
            name: geocode.name,
            state: geocode.state ?? null,
            country: geocode.country,
            lat: geocode.lat,
            lon: geocode.lon
        });
    }

    public async deleteLink(user: User, guild?: Guild | null): Promise<void> {
        return this.delete({
            user_id: user.id,
            guild_id: guild ? guild.id : '',
        });
    }

    public async createTable(): Promise<void> {
        const sql = fs.readFileSync(`${path.resolve()}/res/schemas/${this.table}.sql`, 'utf8');
        return this.query(sql).catch(error => {
            if (error.code !== 'ER_TABLE_EXISTS_ERROR') throw error.reason;
        });
    }
}
