export interface GeocodeData {
    readonly name: string,
    readonly local_names: {
        ascii: string,
        en: string,
        feature_name: string
    },
    readonly lat: number,
    readonly lon: number
    readonly country: string,
    readonly state: string
}
