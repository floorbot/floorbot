import { ChatInputApplicationCommandData, Constants } from 'discord.js';

const { ApplicationCommandTypes, ApplicationCommandOptionTypes } = Constants;

export enum WeatherSubCommandName {
    USER = 'user',
    LOCATION = 'location',
    SERVER_TEMPS = 'server_temps',
    LINK = 'link',
    UNLINK = 'unlink'
}

export const WeatherCommandData: ChatInputApplicationCommandData = {
    name: 'weather',
    type: ApplicationCommandTypes.CHAT_INPUT,
    description: 'Get weather, forecast or air pollution for places',
    options: [{
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        name: WeatherSubCommandName.USER,
        description: 'Get the weather for yourself or someone else',
        options: [{
            type: ApplicationCommandOptionTypes.USER,
            name: 'user',
            description: 'A specific user to get weather for',
            required: false
        }]
    }, {
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        name: WeatherSubCommandName.LOCATION,
        description: 'Get the weather for somewhere specific',
        options: [{
            type: ApplicationCommandOptionTypes.STRING,
            name: 'city_name',
            description: 'The city to use (eg: \"Sydney\")',
            required: true
        }, {
            type: ApplicationCommandOptionTypes.STRING,
            name: 'country_code',
            description: 'The country (ISO 3166) code to use (eg: \"AU\")',
            required: false
        }, {
            type: ApplicationCommandOptionTypes.STRING,
            name: 'state_code',
            description: 'The state code to use (eg: \"NSW\")',
            required: false
        }]
    }, {
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        name: WeatherSubCommandName.SERVER_TEMPS,
        description: 'Get the weather for everyone with a saved location'
    }, {
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        name: WeatherSubCommandName.LINK,
        description: 'Link a location to your profile',
        options: [{
            type: ApplicationCommandOptionTypes.STRING,
            name: 'city_name',
            description: 'The city to use (eg: \"Sydney\")',
            required: true
        }, {
            type: ApplicationCommandOptionTypes.STRING,
            name: 'country_code',
            description: 'The country (ISO 3166) code to use (eg: \"AU\")',
            required: false
        }, {
            type: ApplicationCommandOptionTypes.STRING,
            name: 'state_code',
            description: 'The state code to use (eg: \"NSW\")',
            required: false
        }, {
            type: ApplicationCommandOptionTypes.USER,
            name: 'user',
            required: false,
            description: '[ADMIN] The user to force link the location to'
        }]
    }, {
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        name: WeatherSubCommandName.UNLINK,
        description: 'Unlink the location from your profile',
        options: [{
            type: ApplicationCommandOptionTypes.USER,
            name: 'user',
            required: false,
            description: '[ADMIN] The user to force unlink the location from'
        }]
    }]
}
