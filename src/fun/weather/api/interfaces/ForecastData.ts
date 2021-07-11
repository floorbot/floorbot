export interface ForecastData {
    readonly cod: string,
    readonly message: number,
    readonly cnt: number,
    readonly list: Array<ForecastDataEntry>,
    readonly city: {
        readonly id: number,
        readonly name: string,
        readonly population: number,
        readonly coord: {
            readonly lat: number,
            readonly lon: number
        },
        readonly country: string,
        readonly state: string,
        readonly timezone: number,
        readonly sunrise: number,
        readonly sunset: number
    }
}

export interface ForecastDataEntry {
    readonly dt: number,
    readonly main: {
        readonly temp: number,
        readonly feels_like: number,
        readonly temp_min: number,
        readonly temp_max: number,
        readonly pressure: number,
        readonly sea_level: number,
        readonly grnd_level: number,
        readonly humidity: number,
        readonly temp_kf: number
    },
    readonly weather: Array<ForecastDataEntryWeather>,
    readonly clouds: {
        readonly all: number
    },
    readonly wind: {
        readonly speed: number,
        readonly deg: number,
        readonly gust: number
    },
    readonly visibility: number,
    readonly pop: number,
    readonly sys: {
        readonly pod: string
    },
    readonly dt_txt: string
}

export interface ForecastDataEntryWeather {
    readonly id: number,
    readonly main: string,
    readonly description: string,
    readonly icon: string
}
