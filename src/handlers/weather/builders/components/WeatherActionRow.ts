import { ActionRowBuilder, AnyComponentBuilder, MessageActionRowComponentBuilder } from 'discord.js';
import { OpenWeatherAPI } from '../../../../api/apis/open_weather/OpenWeatherAPI.js';
import { OneCallData } from '../../../../api/apis/open_weather/interfaces/OneCallData.js';
import { WeatherButton, WeatherButtonId } from './WeatherButton.js';
import { WeatherSelectMenuOptionValue } from './WeatherSelectMenuOption.js';
import { WeatherStringSelectMenu, WeatherStringSelectMenuId } from './WeatherStringSelectMenu.js';

export type WeatherComponentID = WeatherButtonId | WeatherStringSelectMenuId;

export class WeatherActionRow<T extends AnyComponentBuilder> extends ActionRowBuilder<T> {

    public static detailButtons(onecall: OneCallData, exclude?: WeatherButtonId): WeatherActionRow<MessageActionRowComponentBuilder> {
        return new WeatherActionRow<MessageActionRowComponentBuilder>()
            .setComponents(
                ...(exclude !== WeatherButtonId.Current ? [WeatherButton.current()] : []),
                ...(exclude !== WeatherButtonId.Forecast ? [WeatherButton.forecast()] : []),
                ...(exclude !== WeatherButtonId.AirQuality ? [WeatherButton.airQuality()] : []),
                ...(exclude !== WeatherButtonId.Alert && onecall.alerts?.length ? [WeatherButton.alert()] : []),
            ).addViewOnlineButton(OpenWeatherAPI.getGoogleMapsLink(onecall));
    }

    public static pageableButtons(): WeatherActionRow<MessageActionRowComponentBuilder> {
        return new WeatherActionRow<MessageActionRowComponentBuilder>()
            .addPreviousPageButton()
            .addNextPageButton();
    }

    public static viewOrderSelectMenu(selected?: WeatherSelectMenuOptionValue): WeatherActionRow<MessageActionRowComponentBuilder> {
        const selectMenu = WeatherStringSelectMenu.viewOrder(selected);
        return new WeatherActionRow<MessageActionRowComponentBuilder>()
            .setComponents(selectMenu);
    }
}
