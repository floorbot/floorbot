import { WeatherSlashCommandStringOption, WeatherSlashCommandStringOptionName } from './options/WeatherSlashCommandStringOption.js';
import { WeatherSlashCommandUserOption, WeatherSlashCommandUserOptionName } from './options/WeatherSlashCommandUserOption.js';
import { SlashCommandSubcommandBuilder } from 'discord.js';

export enum WeatherSubcommandName {
    User = 'user',
    Location = 'location',
    All = 'all',
    Link = 'link',
    Unlink = 'unlink'
}

export type WeatherSubcommandOptionName = WeatherSlashCommandStringOptionName | WeatherSlashCommandUserOptionName;

export class WeatherSlashCommandSubcommand extends SlashCommandSubcommandBuilder {

    public static user(): WeatherSlashCommandSubcommand {
        return new WeatherSlashCommandSubcommand()
            .setName(WeatherSubcommandName.User)
            .setDescription('Get the weather for yourself or someone else')
            .addUserOption(WeatherSlashCommandUserOption.user());
    }

    public static location(): WeatherSlashCommandSubcommand {
        return new WeatherSlashCommandSubcommand()
            .setName(WeatherSubcommandName.Location)
            .setDescription('Get the weather for somewhere specific')
            .addStringOption(WeatherSlashCommandStringOption.cityName())
            .addStringOption(WeatherSlashCommandStringOption.countryCode())
            .addStringOption(WeatherSlashCommandStringOption.stateCode());
    }

    public static all(): WeatherSlashCommandSubcommand {
        return new WeatherSlashCommandSubcommand()
            .setName(WeatherSubcommandName.All)
            .setDescription('Get the weather for everyone with a saved location');
    }

    public static link(): WeatherSlashCommandSubcommand {
        return new WeatherSlashCommandSubcommand()
            .setName(WeatherSubcommandName.Link)
            .setDescription('Link a location to your profile')
            .addStringOption(WeatherSlashCommandStringOption.cityName())
            .addStringOption(WeatherSlashCommandStringOption.countryCode())
            .addStringOption(WeatherSlashCommandStringOption.stateCode())
            .addUserOption(WeatherSlashCommandUserOption.user());
    }

    public static unlink(): WeatherSlashCommandSubcommand {
        return new WeatherSlashCommandSubcommand()
            .setName(WeatherSubcommandName.Unlink)
            .setDescription('Unlink the location from your profile')
            .addUserOption(WeatherSlashCommandUserOption.user());
    }
}
