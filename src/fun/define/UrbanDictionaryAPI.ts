import Bottleneck from "bottleneck";
import fetch from 'node-fetch';

export class UrbanDictionaryAPI {

    private static readonly LIMITER = new Bottleneck({
        reservoir: 60,
        reservoirRefreshAmount: 60,
        reservoirRefreshInterval: 60 * 1000,
        maxConcurrent: 5,
    })

    private static async request<T>(endpoint: string, params: Map<string, string> = new Map(), options: Object = {}): Promise<T> {
        options = Object.assign({ method: 'GET' }, options)
        const paramString: string = Array.from(params).map((param: Array<string>) => `${param[0]}=${encodeURIComponent(param[1])}`).join('&');
        const url: string = `http://api.urbandictionary.com/v0/${endpoint}?${paramString}`;
        return fetch(url, options).then((res: any) => res.json());
    }

    public static async define(term: string): Promise<Array<UrbanDictionaryData>> {
        const params = new Map([['term', term]]);
        return UrbanDictionaryAPI.LIMITER.schedule(UrbanDictionaryAPI.request, 'define', params)
            .then((res: any) => { return res.list; });
    }

    public static async random(): Promise<Array<UrbanDictionaryData>> {
        return UrbanDictionaryAPI.LIMITER.schedule(UrbanDictionaryAPI.request, 'random')
            .then((res: any) => { return res.list; });
    }
}

export interface UrbanDictionaryData {
    readonly definition: string,
    readonly permalink: string,
    readonly thumbs_up: number,
    readonly sound_urls: Array<string>,
    readonly author: string,
    readonly word: string,
    readonly defid: number,
    readonly current_vote: string,
    readonly written_on: string,
    readonly example: string,
    readonly thumbs_down: number
}
