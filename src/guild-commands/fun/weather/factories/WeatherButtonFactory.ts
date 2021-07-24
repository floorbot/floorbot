import { WeatherCustomData, WeatherHandler, LatLonData, OpenWeatherAPI, GeocodeData, WeatherLinkSchema, WeatherDisplayType, WeatherButtonCustomData } from '../../../..'
import { ButtonFactory, HandlerButton } from 'discord.js-commands';
import { Constants } from 'discord.js';
const { MessageButtonStyles } = Constants;

export class WeatherButtonFactory extends ButtonFactory<WeatherCustomData, WeatherHandler> {

    constructor(handler: WeatherHandler) {
        super(handler);
    }

    public override encode(customData: WeatherButtonCustomData): string {
        return JSON.stringify({
            d: customData.display.charAt(0),
            ...(customData.page && { page: customData.page }),
            ...(customData.name && {
                geo: [
                    customData.name,
                    customData.state || '',
                    customData.country || '',
                    customData.lat,
                    customData.lon
                ].join(',')
            })
        });
    }

    public override decode(customId: string): WeatherButtonCustomData {
        const encoded = JSON.parse(customId);
        const geoParts = encoded.geo ? encoded.geo.split(',') : [];
        return {
            display: Object.values(WeatherDisplayType).find(name => name.charAt(0) === encoded.d)!,
            ...(encoded.page && { page: encoded.page }),
            ...(encoded.geo && {
                name: geoParts[0],
                ...(geoParts[1] && { state: geoParts[1] }),
                ...(geoParts[2] && { country: geoParts[2] }),
                lat: parseFloat(geoParts[3]),
                lon: parseFloat(geoParts[4]),
            })
        }
    }

    public static getViewMapButton(handler: WeatherHandler, location: LatLonData): HandlerButton<WeatherCustomData, WeatherHandler> {
        return new HandlerButton(handler)
            .setURL(OpenWeatherAPI.getGoogleMapsLink(location))
            .setStyle(MessageButtonStyles.LINK)
            .setLabel('View Map');
    }

    public static getWeatherButton(handler: WeatherHandler, display: WeatherDisplayType, scope: GeocodeData | WeatherLinkSchema | number): HandlerButton<WeatherCustomData, WeatherHandler> {
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
