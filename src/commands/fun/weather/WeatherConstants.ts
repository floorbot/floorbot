import { HandlerCustomData } from 'discord.js-commands';

export enum WeatherTempsOrder {
    HUMIDITY = 'humidity',
    HOTTEST = 'hottest',
    TIMEZONE = 'timezone'
}

export enum WeatherDisplayType {
    WARNING = 'warning',
    CURRENT = 'current',
    FORECAST = 'forecast',
    AIR_QUALITY = 'air_quality',
    SERVER_TEMPS = 'server_temps',
}

export interface WeatherButtonCustomData extends HandlerCustomData {
    readonly display: WeatherDisplayType,
    readonly name?: string,
    readonly state?: string | null,
    readonly country?: string | null,
    readonly lat?: number,
    readonly lon?: number,
    readonly page?: number,
    readonly wl?: string
}

export type WeatherCustomData = WeatherButtonCustomData | HandlerCustomData;
