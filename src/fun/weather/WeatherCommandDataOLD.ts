import { ApplicationCommandData, ApplicationCommandOptionData, Constants } from 'discord.js';
const { ApplicationCommandOptionTypes } = Constants;

export enum WeatherSubCommandNames {
    CURRENT = 'current',
    FORECAST = 'forecast',
    AIR_QUALITY = 'air_quality',
    TEMPS = 'temps',
    LINK = 'link',
    UNLINK = 'unlink'
}

export const WeatherCommandData: ApplicationCommandData = {
    name: 'weather',
    description: 'Get weather, forecast or air pollution for places',
    options: [{
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        name: WeatherSubCommandNames.CURRENT,
        description: 'Get the current weather',
        options: getLocationApplicationOptionData(false)
    }, {
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        name: WeatherSubCommandNames.FORECAST,
        description: 'Get the forecasted weather',
        options: getLocationApplicationOptionData(false)
    }, {
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        name: WeatherSubCommandNames.AIR_QUALITY,
        description: 'Get the current air quality',
        options: getLocationApplicationOptionData(false)
    }, {
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        name: WeatherSubCommandNames.TEMPS,
        description: 'Get the weather for everyone with a linked location'
    }, {
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        name: WeatherSubCommandNames.LINK,
        description: 'Link a location to your profile',
        options: [...getLocationApplicationOptionData(true, false), {
            type: ApplicationCommandOptionTypes.USER,
            name: 'user',
            required: false,
            description: '[ADMIN] The user to force link the location to'
        }]
    }, {
        type: ApplicationCommandOptionTypes.SUB_COMMAND,
        name: WeatherSubCommandNames.UNLINK,
        description: 'Unlink the location from your profile',
        options: [{
            type: ApplicationCommandOptionTypes.USER,
            name: 'user',
            required: false,
            description: '[ADMIN] The user to force unlink the location from'
        }]
    }]
}

function getLocationApplicationOptionData(cityRequired: boolean = false, userOption: boolean = true): Array<ApplicationCommandOptionData> {
    const options = [{
        type: ApplicationCommandOptionTypes.STRING,
        name: 'city_name',
        description: 'The city to use (eg: \"Sydney\")',
        required: cityRequired
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
    if (userOption) options.push({
        type: ApplicationCommandOptionTypes.USER,
        name: 'user',
        required: false,
        description: 'Get the weather for this users saved location'
    });
    return options;
}
