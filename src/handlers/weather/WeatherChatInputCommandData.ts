import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputApplicationCommandData } from 'discord.js';

export enum WeatherSubcommandName {
    User = 'user',
    Location = 'location',
    All = 'all',
    Link = 'link',
    Unlink = 'unlink'
}

export enum WeatherSlashCommandUserOptionName {
    User = 'user'
}

export enum WeatherSlashCommandStringOptionName {
    CityName = 'city_name',
    CountryCode = 'country_code',
    StateCode = 'state_code'
}

export const WeatherChatInputCommandData: ChatInputApplicationCommandData = {
    name: 'weather',
    type: ApplicationCommandType.ChatInput,
    description: 'Get weather, forecast or air pollution for places',
    options: [{
        name: WeatherSubcommandName.User,
        type: ApplicationCommandOptionType.Subcommand,
        description: 'Get the weather for yourself or someone else',
        options: [{
            name: WeatherSlashCommandUserOptionName.User,
            type: ApplicationCommandOptionType.User,
            description: '[ADMIN] The user to apply these changes to',
            required: false
        }]
    }, {
        name: WeatherSubcommandName.Location,
        type: ApplicationCommandOptionType.Subcommand,
        description: 'Get the weather for somewhere specific',
        options: [{
            name: WeatherSlashCommandStringOptionName.CityName,
            type: ApplicationCommandOptionType.String,
            description: 'The city to use (eg: "Sydney")',
            required: true
        }, {
            name: WeatherSlashCommandStringOptionName.CountryCode,
            type: ApplicationCommandOptionType.String,
            description: 'The country (ISO 3166) code to use (eg: "AU")',
            required: false
        }, {
            name: WeatherSlashCommandStringOptionName.StateCode,
            type: ApplicationCommandOptionType.String,
            description: 'The state code to use (eg: "NSW")',
            required: false
        }]
    }, {
        name: WeatherSubcommandName.All,
        type: ApplicationCommandOptionType.Subcommand,
        description: 'Get the weather for everyone with a saved location'
    }, {
        name: WeatherSubcommandName.Link,
        type: ApplicationCommandOptionType.Subcommand,
        description: 'Link a location to your profile',
        options: [{
            name: WeatherSlashCommandStringOptionName.CityName,
            type: ApplicationCommandOptionType.String,
            description: 'The city to use (eg: "Sydney")',
            required: true
        }, {
            name: WeatherSlashCommandStringOptionName.CountryCode,
            type: ApplicationCommandOptionType.String,
            description: 'The country (ISO 3166) code to use (eg: "AU")',
            required: false
        }, {
            name: WeatherSlashCommandStringOptionName.StateCode,
            type: ApplicationCommandOptionType.String,
            description: 'The state code to use (eg: "NSW")',
            required: false
        }, {
            name: WeatherSlashCommandUserOptionName.User,
            type: ApplicationCommandOptionType.User,
            description: '[ADMIN] The user to apply these changes to',
            required: false
        }]
    }, {
        name: WeatherSubcommandName.Unlink,
        type: ApplicationCommandOptionType.Subcommand,
        description: 'Unlink the location from your profile',
        options: [{
            name: WeatherSlashCommandUserOptionName.User,
            type: ApplicationCommandOptionType.User,
            description: '[ADMIN] The user to apply these changes to',
            required: false
        }]
    }]
};
