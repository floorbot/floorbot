import { Constants, MessageButton, MessageButtonOptions } from 'discord.js';
import { HandlerButton } from '../../../../components/HandlerButton';
import { LatLonData, OpenWeatherAPI } from '../api/OpenWeatherAPI';

const { MessageButtonStyles } = Constants;

export enum WeatherButtonTypes {
    WARNING = 'warning',
    CURRENT = 'current',
    FORECAST = 'forecast',
    AIR_QUALITY = 'air_quality'
}

export class WeatherButton extends HandlerButton {

    constructor(data?: MessageButton | MessageButtonOptions) {
        super(data);
    }

    public static getViewMapButton(location: LatLonData): WeatherButton {
        return new WeatherButton()
            .setURL(OpenWeatherAPI.getGoogleMapsLink(location))
            .setStyle(MessageButtonStyles.LINK)
            .setLabel('View Map');
    }

    public static getWeatherButton(display: WeatherButtonTypes): WeatherButton {
        const button = new WeatherButton().setCustomId(display);
        switch (display) {
            case WeatherButtonTypes.WARNING:
                button.setStyle(MessageButtonStyles.DANGER);
                button.setLabel('⚠️ Weather Alert');
                break;
            case WeatherButtonTypes.CURRENT:
                button.setStyle(MessageButtonStyles.SUCCESS);
                button.setLabel('Current');
                break;
            case WeatherButtonTypes.FORECAST:
                button.setStyle(MessageButtonStyles.SUCCESS);
                button.setLabel('Forecast');
                break;
            case WeatherButtonTypes.AIR_QUALITY:
                button.setStyle(MessageButtonStyles.SUCCESS);
                button.setLabel('Air Quality');
                break;
            default: throw display;
        }
        return button;
    }

    public static getNextPageButton(page: number): WeatherButton {
        return new WeatherButton()
            .setCustomId('next_page')
            .setLabel(page ? `Page ${page}` : 'Next')
            .setStyle(MessageButtonStyles.PRIMARY)
    }

    public static getPreviousPageButton(page: number): WeatherButton {
        return new WeatherButton()
            .setCustomId('previous_page')
            .setLabel(page ? `Page ${page}` : 'Previous')
            .setStyle(MessageButtonStyles.PRIMARY)
    }
}
