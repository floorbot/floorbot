import { WeatherSelectMenu, WeatherSelectMenuId, WeatherSelectMenuOptionValue } from './WeatherSelectMenu.js';
import { ActionRowBuilder, AnyComponentBuilder, MessageActionRowComponentBuilder } from 'discord.js';
import { OneCallData } from '../../open_weather/interfaces/OneCallData.js';
import { WeatherButton, WeatherButtonId } from './WeatherButton.js';
import { ButtonBuilder } from '../../../../lib/discord.js/builders/ButtonBuilder.js';
import { OpenWeatherAPI } from '../../open_weather/OpenWeatherAPI.js';

export type WeatherComponentID = WeatherButtonId | WeatherSelectMenuId;

export class WeatherActionRow<T extends AnyComponentBuilder> extends ActionRowBuilder<T> {

    public static detailButtons(onecall: OneCallData, exclude?: WeatherButtonId): WeatherActionRow<MessageActionRowComponentBuilder> {
        return new WeatherActionRow<MessageActionRowComponentBuilder>()
            .setComponents(
                ...(exclude !== WeatherButtonId.Current ? [WeatherButton.current()] : []),
                ...(exclude !== WeatherButtonId.Forecast ? [WeatherButton.forecast()] : []),
                ...(exclude !== WeatherButtonId.AirQuality ? [WeatherButton.airQuality()] : []),
                ...(exclude !== WeatherButtonId.Alert && onecall.alerts?.length ? [WeatherButton.alert()] : []),
                ButtonBuilder.viewOnline(OpenWeatherAPI.getGoogleMapsLink(onecall))
            );
    }

    public static viewOrderSelectMenu(selected: WeatherSelectMenuOptionValue): WeatherActionRow<MessageActionRowComponentBuilder> {
        const selectMenu = WeatherSelectMenu.viewOrder(selected);
        return new WeatherActionRow<MessageActionRowComponentBuilder>()
            .setComponents(selectMenu);
    }
}
