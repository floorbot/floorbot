import { WeatherCustomData, WeatherHandler, WeatherTempsOrder } from '../../../..'
import { SelectMenuFactory, HandlerSelectMenu, HandlerCustomData } from 'discord.js-commands';

export class WeatherSelectMenuFactory extends SelectMenuFactory<WeatherCustomData, WeatherHandler> {

    constructor(handler: WeatherHandler) {
        super(handler);
    }

    public static getOrderSelectMenu(handler: WeatherHandler, selected: WeatherTempsOrder): HandlerSelectMenu<HandlerCustomData, WeatherHandler> {
        const selectMenu = new HandlerSelectMenu(handler);
        for (const orderName of Object.values(WeatherTempsOrder)) {
            selectMenu.addOptions({
                label: `Order by ${orderName}`,
                default: orderName === selected,
                value: orderName
            })
        }
        selectMenu.setCustomId({});
        return selectMenu;
    }
}
