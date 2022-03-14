import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputApplicationCommandData } from 'discord.js';

export enum WeatherSubCommand {
    USER = 'user',
    LOCATION = 'location',
    SERVER_TEMPS = 'server_temps',
    LINK = 'link',
    UNLINK = 'unlink'
}

export const WeatherCommandData: ChatInputApplicationCommandData = {
    name: 'weather',
    type: ApplicationCommandType.ChatInput,
    description: 'Get weather, forecast or air pollution for places',
    options: [{
        type: ApplicationCommandOptionType.Subcommand,
        name: WeatherSubCommand.USER,
        description: 'Get the weather for yourself or someone else',
        options: [{
            type: ApplicationCommandOptionType.User,
            name: 'user',
            description: 'A specific user to get weather for',
            required: false
        }]
    }, {
        type: ApplicationCommandOptionType.Subcommand,
        name: WeatherSubCommand.LOCATION,
        description: 'Get the weather for somewhere specific',
        options: [{
            type: ApplicationCommandOptionType.String,
            name: 'city_name',
            description: 'The city to use (eg: \"Sydney\")',
            required: true
        }, {
            type: ApplicationCommandOptionType.String,
            name: 'country_code',
            description: 'The country (ISO 3166) code to use (eg: \"AU\")',
            required: false
        }, {
            type: ApplicationCommandOptionType.String,
            name: 'state_code',
            description: 'The state code to use (eg: \"NSW\")',
            required: false
        }]
    }, {
        type: ApplicationCommandOptionType.Subcommand,
        name: WeatherSubCommand.SERVER_TEMPS,
        description: 'Get the weather for everyone with a saved location'
    }, {
        type: ApplicationCommandOptionType.Subcommand,
        name: WeatherSubCommand.LINK,
        description: 'Link a location to your profile',
        options: [{
            type: ApplicationCommandOptionType.String,
            name: 'city_name',
            description: 'The city to use (eg: \"Sydney\")',
            required: true
        }, {
            type: ApplicationCommandOptionType.String,
            name: 'country_code',
            description: 'The country (ISO 3166) code to use (eg: \"AU\")',
            required: false
        }, {
            type: ApplicationCommandOptionType.String,
            name: 'state_code',
            description: 'The state code to use (eg: \"NSW\")',
            required: false
        }, {
            type: ApplicationCommandOptionType.User,
            name: 'user',
            required: false,
            description: '[ADMIN] The user to force link the location to'
        }]
    }, {
        type: ApplicationCommandOptionType.Subcommand,
        name: WeatherSubCommand.UNLINK,
        description: 'Unlink the location from your profile',
        options: [{
            type: ApplicationCommandOptionType.User,
            name: 'user',
            required: false,
            description: '[ADMIN] The user to force unlink the location from'
        }]
    }]
};
