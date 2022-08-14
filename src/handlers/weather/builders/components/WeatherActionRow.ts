import { ActionRowBuilder, AnyComponentBuilder, MessageActionRowComponentBuilder } from 'discord.js';
import { ButtonBuilder } from '../../../../lib/discord.js/builders/ButtonBuilder.js';
import { WeatherSelectMenu, WeatherSelectMenuId } from './WeatherSelectMenu.js';
import { PageableButton } from '../../../../helpers/pageable/PageableButton.js';
import { WeatherSelectMenuOptionValue } from './WeatherSelectMenuOption.js';
import { OneCallData } from '../../open_weather/interfaces/OneCallData.js';
import { OpenWeatherAPI } from '../../open_weather/OpenWeatherAPI.js';
import { WeatherButton, WeatherButtonId } from './WeatherButton.js';

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

    public static pageableButtons(): WeatherActionRow<MessageActionRowComponentBuilder> {
        return new WeatherActionRow<MessageActionRowComponentBuilder>()
            .setComponents(
                PageableButton.previousPage(),
                PageableButton.nextPage()
            );
    }

    public static viewOrderSelectMenu(selected?: WeatherSelectMenuOptionValue): WeatherActionRow<MessageActionRowComponentBuilder> {
        const selectMenu = WeatherSelectMenu.viewOrder(selected);
        return new WeatherActionRow<MessageActionRowComponentBuilder>()
            .setComponents(selectMenu);
    }
}
