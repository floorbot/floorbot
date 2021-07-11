import { ComponentCustomData } from 'discord.js-commands';
import { TempsEmbedOrder } from './embeds/TempsEmbed';
import { MessageButton } from 'discord.js';


export interface WeatherButtonCustomData {
    readonly page?: number,
    readonly cn?: string,
    readonly sc?: string | null,
    readonly cc?: string | null,
    readonly wl?: string,
    readonly sort?: TempsEmbedOrder
}

export type CustomData = WeatherButtonCustomData & ComponentCustomData & {
    readonly fn: WeatherButtonFunction
};

export enum WeatherButtonFunction {
    AIR_QUALITY = 'a',
    FORECAST = 'f',
    CURRENT = 'c',
    TEMPS = 't'
}

export class WeatherButton extends MessageButton {

    public readonly fn: WeatherButtonFunction;

    constructor(fn: WeatherButtonFunction) {
        super();
        this.fn = fn;
    }

    public setCustomId(data: WeatherButtonCustomData | string): this {
        if (typeof data === 'string') return super.setCustomId(data);
        const customData: CustomData = Object.assign({
            id: 'weather',
            fn: this.fn
        }, data)
        return super.setCustomId(JSON.stringify(customData));
    }
}
