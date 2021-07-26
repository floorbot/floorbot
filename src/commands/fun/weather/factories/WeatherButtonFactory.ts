import { WeatherCustomData, WeatherHandler, LatLonData, OpenWeatherAPI, GeocodeData, WeatherLinkSchema, WeatherDisplayType } from '../../../..'
import { HandlerButton } from 'discord.js-commands';
import { Constants } from 'discord.js';
const { MessageButtonStyles } = Constants;

export class WeatherButtonFactory {

    public static getViewMapButton(handler: WeatherHandler, location: LatLonData): HandlerButton<WeatherCustomData> {
        return new HandlerButton(handler)
            .setURL(OpenWeatherAPI.getGoogleMapsLink(location))
            .setStyle(MessageButtonStyles.LINK)
            .setLabel('View Map');
    }

    public static getWeatherButton(handler: WeatherHandler, display: WeatherDisplayType, scope: GeocodeData | WeatherLinkSchema | number): HandlerButton<WeatherCustomData> {
        const button = new HandlerButton(handler);
        switch (display) {
            case WeatherDisplayType.WARNING:
                button.setStyle(MessageButtonStyles.DANGER);
                button.setLabel('⚠️ Weather Alert');
                break;
            case WeatherDisplayType.CURRENT:
                button.setStyle(MessageButtonStyles.SUCCESS);
                button.setLabel('Current');
                break;
            case WeatherDisplayType.FORECAST:
                button.setStyle(MessageButtonStyles.SUCCESS);
                button.setLabel('Forecast');
                break;
            case WeatherDisplayType.AIR_QUALITY:
                button.setStyle(MessageButtonStyles.SUCCESS);
                button.setLabel('Air Quality');
                break;
            case WeatherDisplayType.SERVER_TEMPS:
                button.setStyle(MessageButtonStyles.PRIMARY);
                button.setLabel(`Page ${scope}`);
                break;
            default: throw scope;
        }
        button.setCustomId({
            display: display,
            ...(typeof scope === 'number' && { page: scope }),
            ...(typeof scope !== 'number' && {
                name: scope.name,
                state: scope.state,
                country: scope.country,
                lat: scope.lat,
                lon: scope.lon
            })
        })
        return button;
    }
}