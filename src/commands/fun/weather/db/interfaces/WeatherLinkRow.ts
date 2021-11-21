export default interface WeatherLinkRow {
    readonly user_id: string,
    readonly guild_id: string,
    readonly name: string,
    readonly state: string,
    readonly country: string,
    readonly lat: number,
    readonly lon: number
}
