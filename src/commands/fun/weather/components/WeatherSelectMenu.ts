import { MessageSelectMenu, MessageSelectMenuOptions } from 'discord.js';
import { HandlerSelectMenu } from '../../../../components/HandlerSelectMenu';

export enum WeatherTempsOrder {
    HUMIDITY = 'humidity',
    HOTTEST = 'hottest',
    COLDEST = 'coldest',
    TIMEZONE = 'timezone'
}

export class WeatherSelectMenu extends HandlerSelectMenu {

    constructor(data?: MessageSelectMenu | MessageSelectMenuOptions) {
        super(data);
    };

    public static getOrderSelectMenu(selected: WeatherTempsOrder): WeatherSelectMenu {
        const selectMenu = new WeatherSelectMenu();
        for (const orderName of Object.values(WeatherTempsOrder)) {
            selectMenu.addOptions({
                label: `Order by ${orderName}`,
                default: orderName === selected,
                value: orderName
            })
        }
        selectMenu.setCustomId('order');
        return selectMenu;
    }
}
