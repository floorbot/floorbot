import { HandlerSelectMenu, HandlerSelectMenuID } from '../../../../helpers/components/HandlerSelectMenu.js';
import { MessageSelectMenu, MessageSelectMenuOptions } from 'discord.js';

export const WeatherSelectMenuID = {
    ...HandlerSelectMenuID, ...{
        ORDER: 'order'
    }
};

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

    public static createOrderSelectMenu(selected: WeatherTempsOrder): WeatherSelectMenu {
        const selectMenu = new WeatherSelectMenu();
        for (const orderName of Object.values(WeatherTempsOrder)) {
            selectMenu.addOptions({
                label: `Order by ${orderName}`,
                default: orderName === selected,
                value: orderName
            })
        }
        selectMenu.setCustomId(WeatherSelectMenuID.ORDER);
        return selectMenu;
    }
}
