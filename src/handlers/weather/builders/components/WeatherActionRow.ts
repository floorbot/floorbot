import { WeatherSelectMenu, WeatherSelectMenuId, WeatherSelectMenuOptionValue } from './WeatherSelectMenu.js';
import { OneCallData } from '../../open_weather/interfaces/OneCallData.js';
import { WeatherButton, WeatherButtonId } from './WeatherButton.js';
import { ActionRowBuilder } from 'discord.js';

export type WeatherComponentID = WeatherButtonId | WeatherSelectMenuId;

export class WeatherActionRow extends ActionRowBuilder {

    public static detailButtons(onecall: OneCallData, exclude?: WeatherButtonId) {
        return new WeatherActionRow()
            .setComponents(
                ...(exclude !== WeatherButtonId.Current ? [WeatherButton.current()] : []),
                ...(exclude !== WeatherButtonId.Forecast ? [WeatherButton.forecast()] : []),
                ...(exclude !== WeatherButtonId.AirQuality ? [WeatherButton.airQuality()] : []),
                ...(exclude !== WeatherButtonId.Warning && onecall.alerts?.length ? [WeatherButton.warning()] : [])
            );
    }

    public static viewOrderSelectMenu(selected: WeatherSelectMenuOptionValue): WeatherActionRow {
        const selectMenu = WeatherSelectMenu.viewOrder(selected);
        return new WeatherActionRow()
            .setComponents(selectMenu);
    }
}
