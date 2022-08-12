import { WeatherSelectMenuOption } from './WeatherSelectMenuOption.js';
import { SelectMenuBuilder } from 'discord.js';

export enum WeatherSelectMenuId {
    Order = 'order'
}

export enum WeatherSelectMenuOptionValue {
    Timezone = 'timezone',
    Humidity = 'humidity',
    Hottest = 'hottest',
    Coldest = 'coldest'
}

export class WeatherSelectMenu extends SelectMenuBuilder {

    public static viewOrder(selected: WeatherSelectMenuOptionValue): WeatherSelectMenu {
        const { timezone, humidity, hottest, coldest } = {
            timezone: WeatherSelectMenuOption.timezone().setDefault(selected),
            humidity: WeatherSelectMenuOption.humidity().setDefault(selected),
            hottest: WeatherSelectMenuOption.hottest().setDefault(selected),
            coldest: WeatherSelectMenuOption.coldest().setDefault(selected)
        };
        return new WeatherSelectMenu()
            .setCustomId(WeatherSelectMenuId.Order)
            .setOptions(timezone, humidity, hottest, coldest);
    }
}
