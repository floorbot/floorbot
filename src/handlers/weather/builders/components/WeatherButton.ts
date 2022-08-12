import { ButtonBuilder, ButtonStyle } from 'discord.js';

export enum WeatherButtonId {
    Warning = 'warning',
    Current = 'current',
    Forecast = 'forecast',
    AirQuality = 'air_quality'
}

export class WeatherButton extends ButtonBuilder {

    public static warning(): WeatherButton {
        return new WeatherButton()
            .setCustomId(WeatherButtonId.Warning)
            .setStyle(ButtonStyle.Danger)
            .setLabel('⚠️ Weather Alert');
    }

    public static current(): WeatherButton {
        return new WeatherButton()
            .setCustomId(WeatherButtonId.Current)
            .setStyle(ButtonStyle.Success)
            .setLabel('Current');
    }

    public static forecast(): WeatherButton {
        return new WeatherButton()
            .setCustomId(WeatherButtonId.Forecast)
            .setStyle(ButtonStyle.Success)
            .setLabel('Forecast');
    }

    public static airQuality(): WeatherButton {
        return new WeatherButton()
            .setCustomId(WeatherButtonId.AirQuality)
            .setStyle(ButtonStyle.Success)
            .setLabel('Air Quality');
    }
}
