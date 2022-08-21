import { ActionRowBuilder, AnyComponentBuilder, MessageActionRowComponentBuilder } from 'discord.js';
import { OneCallData } from '../../../../apis/open_weather/interfaces/OneCallData.js';
import { OpenWeatherAPI } from '../../../../apis/open_weather/OpenWeatherAPI.js';
import { PageableButton } from '../../../../helpers/builders/pageable/PageableButton.js';
import { WeatherSelectMenu, WeatherSelectMenuId } from './WeatherSelectMenu.js';
import { ButtonBuilder } from '../../../../../lib/builders/ButtonBuilder.js';
import { WeatherSelectMenuOptionValue } from './WeatherSelectMenuOption.js';
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
