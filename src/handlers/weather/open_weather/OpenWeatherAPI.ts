
import { API, APIOptions, RequestOptions } from '../../../lib/api/API.js';
import { AirPollutionData } from './interfaces/AirPollutionData.js';
import { WeatherAPIError } from './interfaces/WeatherAPIError.js';
import { GeocodeData } from './interfaces/GeocodeData.js';
import { OneCallData } from './interfaces/OneCallData.js';

export type LatLonData = Pick<GeocodeData, 'lat' | 'lon'>;

export interface LocationQuery {
    readonly city_name: string;
    readonly state_code?: string;
    readonly country_code?: string;
}

export interface OpenWeatherRequestOptions extends RequestOptions {
    readonly endpoint: 'geo/1.0/direct' | 'data/2.5/onecall' | 'data/2.5/air_pollution';
    readonly params?: (['appid', string] | ['q', string] | ['lat', string] | ['lon', string] | ['exclude', string] | ['units', 'standard' | 'metric' | 'imperial'])[];
}

export class OpenWeatherAPI extends API<OpenWeatherRequestOptions> {

    private readonly apiKey: string;

    constructor(options: APIOptions<OpenWeatherRequestOptions> & { apiKey: string; }) {
        super(`https://api.openweathermap.org`, options);
        this.apiKey = options.apiKey;
    }

    protected override fetch(request: OpenWeatherRequestOptions & { type: 'json', endpoint: 'geo/1.0/direct'; }): Promise<GeocodeData[] | WeatherAPIError>;
    protected override fetch(request: OpenWeatherRequestOptions & { type: 'json', endpoint: 'data/2.5/onecall'; }): Promise<OneCallData | WeatherAPIError>;
    protected override fetch(request: OpenWeatherRequestOptions & { type: 'json', endpoint: 'data/2.5/air_pollution'; }): Promise<AirPollutionData | WeatherAPIError>;
    protected override fetch(request: OpenWeatherRequestOptions): Promise<unknown> {
        if (request.params && !request.params.some(param => param[0] === 'appid')) request.params.push(['appid', this.apiKey]);
        return super.fetch(request);
    }

    public async geocoding(location: LocationQuery): Promise<GeocodeData[] | WeatherAPIError> {
        const locationString = OpenWeatherAPI.getLocationString(location);
        const params: OpenWeatherRequestOptions['params'] = [['q', locationString], ['units', 'metric']];
        const geocoding = await this.fetch({ endpoint: 'geo/1.0/direct', type: 'json', params });

        if (!this.isError(geocoding)) {
            geocoding.forEach((geocode) => {
                if (geocode.name.toLowerCase() === 'antarctica')
                    geocode = { ...geocode, country: 'AQ' };
            });
        }
        return geocoding;
    }

    public async oneCall(latlon: LatLonData): Promise<OneCallData | WeatherAPIError> {
        return this.fetch({
            endpoint: 'data/2.5/onecall', type: 'json', params: [
                ['lat', latlon.lat.toString()],
                ['lon', latlon.lon.toString()],
                ['exclude', 'minutely,hourly'],
                ['units', 'metric']
            ]
        });
    }

    public async airPollution(latlon: LatLonData): Promise<AirPollutionData | WeatherAPIError> {
        return this.fetch({
            endpoint: 'data/2.5/air_pollution', type: 'json', params: [
                ['lat', latlon.lat.toString()],
                ['lon', latlon.lon.toString()],
                ['units', 'metric']
            ]
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
