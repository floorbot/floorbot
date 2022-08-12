import { SlashCommandStringOption } from 'discord.js';

export enum WeatherSlashCommandStringOptionName {
    CityName = 'city_name',
    CountryCode = 'country_code',
    StateCode = 'state_code'
}

export class WeatherSlashCommandStringOption extends SlashCommandStringOption {

    public static cityName(): WeatherSlashCommandStringOption {
        return new WeatherSlashCommandStringOption()
            .setName(WeatherSlashCommandStringOptionName.CityName)
            .setDescription('The city to use (eg: \"Sydney\")')
            .setRequired(true);
    }

    public static countryCode(): WeatherSlashCommandStringOption {
        return new WeatherSlashCommandStringOption()
            .setName(WeatherSlashCommandStringOptionName.CountryCode)
            .setDescription('The country (ISO 3166) code to use (eg: \"AU\")')
            .setRequired(false);
    }

    public static stateCode(): WeatherSlashCommandStringOption {
        return new WeatherSlashCommandStringOption()
            .setName(WeatherSlashCommandStringOptionName.StateCode)
            .setDescription('The state code to use (eg: \"NSW\")')
            .setRequired(false);
    }
}
