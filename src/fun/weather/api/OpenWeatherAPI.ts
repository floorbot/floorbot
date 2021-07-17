import { AirPollutionData } from './interfaces/AirPollutionData';
import { OneCallData } from './interfaces/OneCallData';
import { GeocodeData } from './interfaces/GeocodeData';
import fetch from 'node-fetch';

import CacheMap from 'cache-map.js';

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

    private readonly reqCache: CacheMap<string, string>;
    private readonly resCache: CacheMap<string, any>;
    private readonly apiKey: string;

    constructor(apiKey: string, limit: number = 60) {
        this.reqCache = new CacheMap({ ttl: 1000 * 60, maxKeys: limit });
        this.resCache = new CacheMap({ ttl: 1000 * 60 * 10 });
        this.apiKey = apiKey;
    }

    private async request(endpoint: string, params: RequestParams): Promise<any | WeatherAPIError> {
        params.set('appid', this.apiKey);
        const paramString = Array.from(params).map((param) => `${param[0]}=${encodeURIComponent(param[1])}`).join('&');
        const url: string = `https://api.openweathermap.org/${endpoint}?${paramString}`.toLowerCase();

        // Cache Checking
        const resCached = this.resCache.get(paramString);
        if (resCached) return resCached;

        // *Rate Limit* Checking
        const isSet = this.reqCache.set(paramString, paramString);
        if (!isSet) return { cod: 429, message: `We have hit the documented API limit...` }

        // API Request
        return fetch(url, { method: 'GET' }).then((res: any) => res.json()).then(json => {
            if (!(json.cod && json.cod === 429)) {
                this.resCache.set(paramString, json);
            }
            return json;
        });
    }

    public async geocoding(location: LocationData): Promise<Array<GeocodeData> | WeatherAPIError> {
        const params = new Map([['q', OpenWeatherAPI.getLocationString(location)], ['units', 'metric']]);
        const geocoding = await this.request('geo/1.0/direct', params);
        if (!OpenWeatherAPI.isError(geocoding)) {
            geocoding.forEach((geocode: any) => {
                if (geocode.name.toLowerCase() === 'antarctica') geocode.country = 'AQ';
            });
        }
        return geocoding;
    }

    public async oneCall(latlon: LatLonData): Promise<OneCallData | WeatherAPIError> {
        const params = new Map([['lat', latlon.lat.toString()], ['lon', latlon.lon.toString()], ['exclude', 'minutely,hourly'], ['units', 'metric']]);
        return this.request('data/2.5/onecall', params);
    }

    public async airPollution(location: LatLonData): Promise<AirPollutionData | WeatherAPIError> {
        const params = new Map([['lat', location.lat.toString()], ['lon', location.lon.toString()], ['units', 'metric']]);
        return this.request('data/2.5/air_pollution', params);
    }

    public static getLocationString(scope: LocationData | GeocodeData | { name: string, state?: string, country?: string }, space?: boolean): string {
        if ('name' in scope) {
            const countryCode = (scope.country && scope.country.toUpperCase() === 'ANTARCTICA') ? 'AQ' : scope.country;
            return [scope.name, scope.state, countryCode].filter(part => part).join(space ? ', ' : ',');
        } else {
            const countryCode = (scope.country_code && scope.country_code.toUpperCase() === 'AQ') ? null : scope.country_code;
            return [scope.city_name, scope.state_code, countryCode].filter(part => part).join(space ? ', ' : ',');
        }
    }

    public static getGoogleMapsLink(location: LatLonData): string {
        return `https://www.google.com/maps/@${location.lat},${location.lon},13z`;
    }

    public static isError(data: any): data is WeatherAPIError {
        return ('cod' in data && data.cod >= 400);
    }
}
