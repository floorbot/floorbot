export interface AirPollutionData {
    readonly coord: {
        readonly lat: number,
        readonly lon: number
    },
    readonly list: Array<{
        readonly dt: number,
        readonly main: {
            readonly aqi: number
        },
        readonly components: {
            readonly co: number,
            readonly no: number,
            readonly no2: number,
            readonly o3: number,
            readonly so2: number,
            readonly pm2_5: number,
            readonly pm10: number,
            readonly nh3: number
        }
    }>
}
