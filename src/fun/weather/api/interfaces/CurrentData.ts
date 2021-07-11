export interface CurrentData {
    readonly coord: {
        readonly lat: number,
        readonly lon: number
    }
    readonly weather: Array<CurrentDataWeather>,
    readonly base: string,
    readonly main: {
        readonly temp: number,
        readonly feels_like: number,
        readonly temp_min: number,
        readonly temp_max: number,
        readonly pressure: number,
        readonly humidity: number,
    },
    readonly visibility: number,
    readonly wind: {
        readonly speed: number,
        readonly deg: number
    },
    readonly clouds: {
        readonly all: number
    },
    readonly dt: number,
    readonly sys: {
        readonly type: number,
        readonly id: number,
        readonly message: number,
        readonly country: string,
        readonly state: string,
        readonly sunrise: number,
        readonly sunset: number
    },
    readonly timezone: number,
    readonly id: number,
    readonly name: string,
    readonly cod: number
}

export interface CurrentDataWeather {
    readonly id: number,
    readonly main: string,
    readonly description: string,
    readonly icon: string
}
