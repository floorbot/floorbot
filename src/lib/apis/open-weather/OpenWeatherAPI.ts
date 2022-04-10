import { AirPollutionData } from './interfaces/AirPollutionData';
import { OneCallData } from './interfaces/OneCallData';
import { GeocodeData } from './interfaces/GeocodeData';
import fetch, { Headers } from 'node-fetch';
import Bottleneck from 'bottleneck';
import CacheMap from 'cache-map';
import { Redis } from 'ioredis';

export { AirPollutionData, GeocodeData, OneCallData };

export interface OpenWeatherAPIConstructorOptions {
    readonly apiKey: string;
    readonly redis?: Redis;
    readonly apiLimits?: {
        readonly perMonth: number;
        readonly perMinute: number;
        readonly dailyOneCall: number;
    };
}

export interface LocationQuery {
    readonly city_name: string;
    readonly state_code?: string;
    readonly country_code?: string;
}

export interface WeatherAPIError {
    readonly cod: number;
    readonly message: string;
}

export type LatLonData = Pick<GeocodeData, 'lat' | 'lon'>;

export class OpenWeatherAPI {

    private readonly airPollutionCache: CacheMap<string, AirPollutionData> = new CacheMap({ ttl: 1000 * 60 * 10 }); // 10 minute cache (api spec)
    private readonly geocodingCache: CacheMap<string, GeocodeData[]> = new CacheMap({ ttl: 1000 * 60 * 10 }); // 10 minute cache (api spec)
    private readonly onecallCache: CacheMap<string, OneCallData> = new CacheMap({ ttl: 1000 * 60 * 10 }); // 10 minute cache (api spec)
    private readonly minutelyLimit: Bottleneck;
    private readonly onecallLimit: Bottleneck;
    private readonly expiration: number;
    private readonly apiKey: string;


    constructor(options: OpenWeatherAPIConstructorOptions) {
        const apiLimits = options.apiLimits || { perMonth: 1000000, perMinute: 60, dailyOneCall: 1000 };
        this.expiration = 1000 * 60; // 60 second queue expiration
        this.apiKey = options.apiKey;
        const redis = options.redis;

        // Creates a monthly (31 day) limit of specified requests (api limits)
        const monthlyLimit = new Bottleneck({
            id: `openweather-month-${this.apiKey}`, maxConcurrent: 1, minTime: 0,
            reservoir: Math.floor(apiLimits.perMonth / 31),
            reservoirRefreshInterval: 1000 * 60 * 60 * 24 * 31,
            reservoirRefreshAmount: Math.floor(apiLimits.perMonth / 31),
            highWater: 10, // Same as maxConcurrent
            strategy: Bottleneck.strategy.OVERFLOW,
            ...(redis && redis.options && {
                datastore: 'ioredis',
                clearDatastore: false,
                clientOptions: {
                    host: redis.options.host,
                    port: redis.options.port
                }
            })
        });

        // Creates a minutely (60 second) limit of specified requests (api limits)
        this.minutelyLimit = new Bottleneck({
            id: `openweather-minute-${this.apiKey}`, maxConcurrent: 1, minTime: 0,
            reservoir: apiLimits.perMinute,
            reservoirRefreshInterval: 1000 * 60,
            reservoirRefreshAmount: apiLimits.perMinute,
            highWater: 10, // Same as maxConcurrent
            strategy: Bottleneck.strategy.OVERFLOW,
            ...(redis && redis.options && {
                datastore: 'ioredis',
                clearDatastore: false,
                clientOptions: {
                    host: redis.options.host,
                    port: redis.options.port
                }
            })
        });

        // Creates a daily (24 hour) limit of specified one call requests (api limits)
        this.onecallLimit = new Bottleneck({
            id: `openweather-minute-${this.apiKey}`, maxConcurrent: 1, minTime: 0,
            reservoir: apiLimits.dailyOneCall,
            reservoirRefreshInterval: 1000 * 60 * 60 * 24,
            reservoirRefreshAmount: apiLimits.dailyOneCall,
            highWater: 10, // Same as maxConcurrent
            strategy: Bottleneck.strategy.OVERFLOW,
            ...(redis && redis.options && {
                datastore: 'ioredis',
                clearDatastore: false,
                clientOptions: {
                    host: redis.options.host,
                    port: redis.options.port
                }
            })
        });

        this.minutelyLimit.chain(monthlyLimit);
        this.onecallLimit.chain(this.minutelyLimit);
    }

    private async request(endpoint: string, params: [string, string | number][], headers?: Headers): Promise<any> {
        params.push(['appid', this.apiKey]);
        const paramString = params.map((param) => `${param[0]}=${encodeURIComponent(param[1])}`).join('&');
        const url = `https://api.openweathermap.org/${endpoint}?${paramString}`;
        const options = { method: 'GET', headers: headers || new Headers() };
        return fetch(url, options).then((res: any) => res.json());
    }

    public async geocoding(location: LocationQuery): Promise<GeocodeData[] | WeatherAPIError> {
        const locationString = OpenWeatherAPI.getLocationString(location);
        const existing = this.geocodingCache.get(locationString);
        if (existing) return existing;
        return this.minutelyLimit.schedule({ expiration: this.expiration }, async () => {
            const params: [string, string | number][] = [['q', locationString], ['units', 'metric']];
            const geocoding = await this.request('geo/1.0/direct', params);
            if (!this.isError(geocoding)) {
                geocoding.forEach((geocode: any) => {
                    if (geocode.name.toLowerCase() === 'antarctica')
                        geocode.country = 'AQ';
                });
            }
            this.geocodingCache.set(locationString, geocoding);
            return geocoding;
        });
    }

    public async oneCall(latlon: LatLonData): Promise<OneCallData | WeatherAPIError> {
        const cacheKey = `${latlon.lat}-${latlon.lon}`;
        const existing = this.onecallCache.get(cacheKey);
        if (existing) return existing;
        return this.onecallLimit.schedule({ expiration: this.expiration }, async () => {
            const params: [string, string | number][] = [
                ['lat', latlon.lat.toString()],
                ['lon', latlon.lon.toString()],
                ['exclude', 'minutely,hourly'],
                ['units', 'metric']
            ];
            const onecall = await this.request('data/2.5/onecall', params);
            this.onecallCache.set(cacheKey, onecall);
            return onecall;
        });
    }

    public async airPollution(latlon: LatLonData): Promise<AirPollutionData | WeatherAPIError> {
        const cacheKey = `${latlon.lat}-${latlon.lon}`;
        const existing = this.airPollutionCache.get(cacheKey);
        if (existing) return existing;
        return this.minutelyLimit.schedule({ expiration: this.expiration }, async () => {
            const params: [string, string | number][] = [
                ['lat', latlon.lat.toString()],
                ['lon', latlon.lon.toString()],
                ['units', 'metric']
            ];
            const airPollution = await this.request('data/2.5/air_pollution', params);
            this.airPollutionCache.set(cacheKey, airPollution);
            return airPollution;
        });
    }

    public static getLocationString(scope: LocationQuery | GeocodeData | { name: string, state?: string, country?: string; }, space?: boolean): string {
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

    public static getGoogleMapsLink(latlon: LatLonData): string {
        return `https://www.google.com/maps/@${latlon.lat},${latlon.lon},13z`;
    }

    public isError(data: any): data is WeatherAPIError {
        return ('cod' in data && data.cod >= 400);
    }
}
