import { WeatherHandler, WeatherTempsOrder } from '../../../..'
import { HandlerSelectMenu, HandlerCustomData } from 'discord.js-commands';

export class WeatherSelectMenuFactory {

    public static getOrderSelectMenu(handler: WeatherHandler, selected: WeatherTempsOrder): HandlerSelectMenu<HandlerCustomData> {
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
