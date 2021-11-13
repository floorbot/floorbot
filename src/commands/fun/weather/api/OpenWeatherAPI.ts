import { AirPollutionData } from './interfaces/AirPollutionData';
import { OneCallData } from './interfaces/OneCallData';
import { GeocodeData } from './interfaces/GeocodeData';
import CacheMap from 'cache-map';
import fetch from 'node-fetch';
import nconf from 'nconf';

export { AirPollutionData, GeocodeData, OneCallData };

export interface LocationData {
    readonly city_name: string,
    readonly state_code?: string,
    readonly country_code?: string
}

export interface LatLonData {
    readonly lat: number,
    readonly lon: number
}

export type RequestParams = Map<string, string | number>;

export interface WeatherAPIError {
    readonly cod: number,
    readonly message: string
}

export class OpenWeatherAPI {

    private static readonly reqCache: CacheMap<string, string> = new CacheMap({ ttl: 1000 * 60, maxKeys: 60 });
    private static readonly resCache: CacheMap<string, any> = new CacheMap({ ttl: 1000 * 60 * 10 });
    private static readonly apiKey: string = nconf.get('OPEN_WEATHER_API_KEY');

    private static async request(endpoint: string, params: RequestParams): Promise<any | WeatherAPIError> {
        params.set('appid', OpenWeatherAPI.apiKey);
        const paramString = Array.from(params).map((param) => `${param[0]}=${encodeURIComponent(param[1])}`).join('&');
        const url: string = `https://api.openweathermap.org/${endpoint}?${paramString}`.toLowerCase();

        // Cache Checking
        const resCached = OpenWeatherAPI.resCache.get(paramString);
        if (resCached) return resCached;

        // *Rate Limit* Checking
        const isSet = OpenWeatherAPI.reqCache.set(paramString, paramString);
        if (!isSet) return { cod: 429, message: `We have hit the documented API limit...` }

        // API Request
        return fetch(url, { method: 'GET' }).then((res: any) => res.json()).then(json => {
            if (!(json.cod && json.cod === 429)) {
                OpenWeatherAPI.resCache.set(paramString, json);
            }
            return json;
        });
    }

    public static async geocoding(location: LocationData): Promise<Array<GeocodeData> | WeatherAPIError> {
        const params = new Map([['q', OpenWeatherAPI.getLocationString(location)], ['units', 'metric']]);
        const geocoding = await OpenWeatherAPI.request('geo/1.0/direct', params);
        if (!OpenWeatherAPI.isError(geocoding)) {
            geocoding.forEach((geocode: any) => {
                if (geocode.name.toLowerCase() === 'antarctica') geocode.country = 'AQ';
            });
        }
        return geocoding;
    }

    public static async oneCall(latlon: LatLonData): Promise<OneCallData | WeatherAPIError> {
        const params = new Map([['lat', latlon.lat.toString()], ['lon', latlon.lon.toString()], ['exclude', 'minutely,hourly'], ['units', 'metric']]);
        return OpenWeatherAPI.request('data/2.5/onecall', params);
    }

    public static async airPollution(location: LatLonData): Promise<AirPollutionData | WeatherAPIError> {
        const params = new Map([['lat', location.lat.toString()], ['lon', location.lon.toString()], ['units', 'metric']]);
        return OpenWeatherAPI.request('data/2.5/air_pollution', params);
    }

    public static getLocationString(scope: LocationData | GeocodeData | { name: string, state?: string, country?: string }, space?: boolean): string {
        if ('name' in scope) {
            const countryCode = (scope.country && scope.country.toUpperCase() === 'ANTARCTICA') ? 'AQ' : scope.country;
            const stateCode = (scope.country && scope.country.toUpperCase() === 'ANTARCTICA') ? null : scope.state;
            return [scope.name, stateCode, countryCode].filter(part => part).join(space ? ', ' : ',');
        } else {
            const countryCode = (scope.country_code && scope.country_code.toUpperCase() === 'AQ') ? null : scope.country_code;
            const stateCode = (scope.country_code && scope.country_code.toUpperCase() === 'AQ') ? null : scope.state_code;
            return [scope.city_name, stateCode, countryCode].filter(part => part).join(space ? ', ' : ',');
        }
    }

    public static getGoogleMapsLink(location: LatLonData): string {
        return `https://www.google.com/maps/@${location.lat},${location.lon},13z`;
    }

    public static isError(data: any): data is WeatherAPIError {
        return ('cod' in data && data.cod >= 400);
    }
}
