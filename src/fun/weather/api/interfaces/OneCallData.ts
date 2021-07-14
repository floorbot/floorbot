export interface WeatherData {
    readonly id: number,
    readonly main: string,
    readonly description: string,
    readonly icon: string
}

export interface OneCallData {
    readonly lat: number,
    readonly lon: number,
    readonly timezone: string,
    readonly timezone_offset: number,
    readonly current: {
        readonly dt: number,
        readonly sunrise: number,
        readonly sunset: number,
        readonly temp: number,
        readonly feels_like: number,
        readonly pressure: number,
        readonly humidity: number,
        readonly dew_point: number,
        readonly uvi: number,
        readonly clouds: number,
        readonly visibility: number,
        readonly wind_speed: number,
        readonly wind_deg: number,
        readonly wind_gust: number,
        readonly weather: [WeatherData]
    },
    readonly daily: Array<{
        readonly dt: number,
        readonly sunrise: number,
        readonly sunset: number,
        readonly moonrise: number,
        readonly moonset: number,
        readonly moon_phase: number,
        readonly temp: {
            readonly day: number,
            readonly min: number,
            readonly max: number,
            readonly night: number,
            readonly eve: number,
            readonly morn: number
        },
        readonly feels_like: {
            readonly day: number,
            readonly night: number,
            readonly eve: number,
            readonly morn: number
        },
        readonly pressure: number,
        readonly humidity: number,
        readonly dew_point: number,
        readonly wind_speed: number,
        readonly wind_deg: number,
        readonly wind_gust: number,
        readonly weather: [WeatherData],
        readonly clouds: number,
        readonly pop: number,
        readonly rain: number,
        readonly uvi: number
    }>
}
