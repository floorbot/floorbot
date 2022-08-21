import { SlashCommandUserOption } from 'discord.js';

export enum WeatherSlashCommandUserOptionName {
    User = 'user'
}

export class WeatherSlashCommandUserOption extends SlashCommandUserOption {

    public static user(): WeatherSlashCommandUserOption {
        return new WeatherSlashCommandUserOption()
            .setName(WeatherSlashCommandUserOptionName.User)
            .setDescription('[ADMIN] The user to apply these changes to')
            .setRequired(false);
    }
}
