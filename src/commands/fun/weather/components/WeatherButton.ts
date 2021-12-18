import { HandlerButton, HandlerButtonID } from '../../../../lib/discord/helpers/components/HandlerButton.js';
import { Constants, MessageButton, MessageButtonOptions } from 'discord.js';
import { LatLonData, OpenWeatherAPI } from '../api/OpenWeatherAPI.js';

const { MessageButtonStyles } = Constants;

export const WeatherButtonID = {
    ...HandlerButtonID, ...{
        WARNING: 'warning',
        CURRENT: 'current',
        FORECAST: 'forecast',
        AIR_QUALITY: 'air_quality'
    }
};

export class WeatherButton extends HandlerButton {

    constructor(data?: MessageButton | MessageButtonOptions) {
        super(data);
    }

    public static createViewMapButton(location: LatLonData): WeatherButton {
        return new WeatherButton()
            .setURL(OpenWeatherAPI.getGoogleMapsLink(location))
            .setStyle(MessageButtonStyles.LINK)
            .setLabel('View Map');
    }

    public static createWeatherButton(display: string): WeatherButton {
        const button = new WeatherButton().setCustomId(display);
        switch (display) {
            case WeatherButtonID.WARNING:
                button.setStyle(MessageButtonStyles.DANGER);
                button.setLabel('⚠️ Weather Alert');
                break;
            case WeatherButtonID.CURRENT:
                button.setStyle(MessageButtonStyles.SUCCESS);
                button.setLabel('Current');
                break;
            case WeatherButtonID.FORECAST:
                button.setStyle(MessageButtonStyles.SUCCESS);
                button.setLabel('Forecast');
                break;
            case WeatherButtonID.AIR_QUALITY:
                button.setStyle(MessageButtonStyles.SUCCESS);
                button.setLabel('Air Quality');
                break;
            default: throw display;
        }
        return button;
    }
}
