import { StringSelectMenuBuilder } from 'discord.js';
import { WeatherSelectMenuOption, WeatherSelectMenuOptionValue } from './WeatherSelectMenuOption.js';

export enum WeatherStringSelectMenuId {
    Order = 'order'
}

export class WeatherStringSelectMenu extends StringSelectMenuBuilder {

    public static viewOrder(selected?: WeatherSelectMenuOptionValue): WeatherStringSelectMenu {
        const { timezone, humidity, hottest, coldest } = {
            timezone: WeatherSelectMenuOption.timezone().setDefault(selected),
            humidity: WeatherSelectMenuOption.humidity().setDefault(selected),
            hottest: WeatherSelectMenuOption.hottest().setDefault(selected),
            coldest: WeatherSelectMenuOption.coldest().setDefault(selected)
        };
        return new WeatherStringSelectMenu()
            .setCustomId(WeatherStringSelectMenuId.Order)
            .setPlaceholder('Select an option to order the list')
            .setOptions(timezone, humidity, hottest, coldest);
    }
}
