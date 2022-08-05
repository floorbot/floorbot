import { GeocodeData } from '../open_weather/interfaces/GeocodeData.js';
import { MariaDBTable } from "../../../lib/MariaDBTable.js";
import { Guild, GuildMember, User } from "discord.js";
import { Pool } from "mariadb";
import path from 'path';
import fs from 'fs';

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

    public async selectLink(scope: User | GuildMember | Guild): Promise<WeatherLinkRow | null> {
        const link = await this.selectLinks(scope);
        return link[0] || null;
    }

    public async selectLinks(scope: User | GuildMember | Guild): Promise<WeatherLinkRow[]> {
        if (scope instanceof GuildMember) return this.select({ user_id: scope.id, guild_id: scope.guild.id });
        else if (scope instanceof Guild) return this.select({ guild_id: scope.id });
        else return this.select({ user_id: scope.id, guild_id: '' });
    }

    public async insertLink(user: User | GuildMember, geocode: GeocodeData): Promise<void> {
        return this.insert({
            user_id: user.id,
            guild_id: user instanceof User ? '' : user.guild.id,
            name: geocode.name,
            state: geocode.state ?? null,
            country: geocode.country,
            lat: geocode.lat,
            lon: geocode.lon
        });
    }

    public async deleteLink(user: User | GuildMember): Promise<void> {
        return this.delete({
            user_id: user.id,
            guild_id: user instanceof User ? '' : user.guild.id,
        });
    }

    public async createTable(): Promise<void> {
        const sql = fs.readFileSync(`${path.resolve()}/res/schemas/weather_link.sql`, 'utf8');
        return this.query(sql).catch(error => {
            if (error.code !== 'ER_TABLE_EXISTS_ERROR') throw error.reason;
        });
    }
}
