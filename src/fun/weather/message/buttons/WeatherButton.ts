import { ComponentCustomData } from 'discord.js-commands';
import { WeatherLinkSchema } from '../../WeatherDatabase';
import { GeocodeData } from '../../api/OpenWeatherAPI';
import { MessageButton, Constants } from 'discord.js';
const { MessageButtonStyles } = Constants;

export enum DisplayType {
    CURRENT = 'current',
    FORECAST = 'forecast',
    AIR_QUALITY = 'air_quality',
    SERVER_TEMPS = 'server_temps'
}

export interface WeatherButtonCustomData extends ComponentCustomData {
    readonly display: DisplayType,
    readonly name?: string,
    readonly state?: string | null,
    readonly country?: string | null,
    readonly lat?: number,
    readonly lon?: number,
    readonly page?: number,
}

export interface EncodedWeatherButtonCustomData extends ComponentCustomData {
    readonly v: string,
    readonly geo?: string,
    readonly page?: number,
}

export class WeatherButton extends MessageButton {

    constructor(display: DisplayType, scope: GeocodeData | WeatherLinkSchema | number) {
        super();
        switch (display) {
            case DisplayType.CURRENT:
                this.setStyle(MessageButtonStyles.SUCCESS);
                this.setLabel('Current');
                break;
            case DisplayType.FORECAST:
                this.setStyle(MessageButtonStyles.SUCCESS);
                this.setLabel('Forecast');
                break;
            case DisplayType.AIR_QUALITY:
                this.setStyle(MessageButtonStyles.SUCCESS);
                this.setLabel('Air Quality');
                break;
            case DisplayType.SERVER_TEMPS:
                this.setStyle(MessageButtonStyles.PRIMARY);
                this.setLabel(`Page ${scope}`);
                break;
            default: throw scope;
        }
        this.setCustomId(JSON.stringify({
            id: 'weather',
            v: display.charAt(0),
            ...(typeof scope === 'number' && { page: scope }),
            ...(typeof scope !== 'number' && { geo: [scope.name, scope.state || '', scope.country || '', scope.lat, scope.lon].join(',') })
        }));
    }

    public static decodeCustomData(data: EncodedWeatherButtonCustomData): WeatherButtonCustomData {
        const geoParts = data.geo ? data.geo.split(',') : [];
        return {
            id: data.id,
            display: Object.values(DisplayType).find(name => name.charAt(0) === data.v)!,
            ...(data.page && { page: data.page }),
            ...(data.geo && {
                name: geoParts[0],
                ...(geoParts[1] && { state: geoParts[1] }),
                ...(geoParts[2] && { city: geoParts[2] }),
                lat: parseFloat(geoParts[3]),
                lon: parseFloat(geoParts[4]),
            })
        }
    }
}
