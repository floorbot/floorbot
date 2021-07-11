import { ForecastData, ForecastDataEntry, ForecastDataEntryWeather } from './interfaces/ForecastData';
import { AirPollutionData, AirPollutionDataEntry } from './interfaces/AirPollutionData';
import { CurrentData, CurrentDataWeather } from './interfaces/CurrentData';
import { GeocodeData } from './interfaces/GeocodeData';
import Bottleneck from "bottleneck";
import fetch from 'node-fetch';
import * as nconf from 'nconf';

nconf.required(['OPEN_WEATHER_API_KEY']);

export {
    ForecastData, ForecastDataEntry, ForecastDataEntryWeather,
    AirPollutionData, AirPollutionDataEntry,
    CurrentData, CurrentDataWeather,
    GeocodeData
};

export interface LocationData {
    readonly city_name: string,
    readonly state_code: string | null,
    readonly country_code: string | null
}

export interface LatLonData {
    readonly lat: number,
    readonly lon: number
}

export class OpenWeatherAPI {

    private static readonly LIMITER = new Bottleneck({
        reservoir: 60,
        reservoirRefreshAmount: 60,
        reservoirRefreshInterval: 60 * 1000,
        maxConcurrent: 5,
    })

    private static async request<T>(endpoint: string, params: Map<string, string>, options: Object = {}): Promise<T> {
        options = Object.assign({ method: 'GET' }, options)
        if (!params.has('appid')) params.set('appid', nconf.get('OPEN_WEATHER_API_KEY'));
        const paramString: string = Array.from(params).map((param: Array<string>) => `${param[0]}=${encodeURIComponent(param[1])}`).join('&');
        const url: string = `https://api.openweathermap.org/${endpoint}?${paramString}`;
        return fetch(url, options).then((res: any) => res.json());
    }

    public static async current(location: LocationData): Promise<CurrentData> {
        const params = new Map([['q', OpenWeatherAPI.getLocationString(location)], ['units', 'metric']]);
        return OpenWeatherAPI.LIMITER.schedule(OpenWeatherAPI.request, 'data/2.5/weather', params)
            .then((current: any) => {
                if (current.cod === 200 && current.name.toLowerCase() === 'antarctica') current.sys.country = 'AQ';
                return current;
            });
    }

    public static async forecast(location: LocationData): Promise<ForecastData> {
        const params = new Map([['q', OpenWeatherAPI.getLocationString(location)], ['units', 'metric']]);
        return OpenWeatherAPI.LIMITER.schedule(OpenWeatherAPI.request, 'data/2.5/forecast', params)
            .then((forecast: any) => {
                if (forecast.cod === 200 && forecast.city.name.toLowerCase() === 'antarctica') forecast.city.country = 'AQ';
                return forecast;
            });
    }

    public static async geocoding(location: LocationData): Promise<Array<GeocodeData>> {
        const params = new Map([['q', OpenWeatherAPI.getLocationString(location)], ['units', 'metric']]);
        return OpenWeatherAPI.LIMITER.schedule(OpenWeatherAPI.request, 'geo/1.0/direct', params).then((geocoding: any) => {
            geocoding.forEach((geocode: any) => { if (geocode.name.toLowerCase() === 'antarctica') geocode.country = 'AQ'; })
            return geocoding;
        });
    }

    public static async airPollution(location: LatLonData): Promise<AirPollutionData> {
        const params = new Map([['lat', location.lat.toString()], ['lon', location.lon.toString()], ['units', 'metric']]);
        return OpenWeatherAPI.LIMITER.schedule(OpenWeatherAPI.request, 'data/2.5/air_pollution', params).then((airPollution: any) => airPollution);
    }

    public static getLocationString(location: LocationData): string {
        const countryCode = (location.country_code && location.country_code.toUpperCase() === 'AQ') ? null : location.country_code;
        return [location.city_name, location.state_code, countryCode].filter(part => part).join(',');
    }

    public static getGoogleMapsLink(location: LatLonData): string {
        return `https://www.google.com/maps/@${location.lat},${location.lon},13z`;
    }
}
