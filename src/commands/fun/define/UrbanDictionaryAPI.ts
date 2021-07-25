import CacheMap from 'cache-map.js';
import fetch from 'node-fetch';

export class UrbanDictionaryAPI {

    private static cache: CacheMap<string, Array<UrbanDictionaryData>> = new CacheMap({ ttl: 1000 * 60 * 60 });

    private static async request(endpoint: string, params: Map<string, string> = new Map(), options: Object = {}): Promise<Array<UrbanDictionaryData>> {
        options = Object.assign({ method: 'GET' }, options)
        const paramString: string = Array.from(params).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');
        const url: string = `http://api.urbandictionary.com/v0/${endpoint}?${paramString}`;
        const existing = UrbanDictionaryAPI.cache.get(paramString);
        return existing || fetch(url, options).then((res) => res.json()).then(res => {
            if (['define'].includes(endpoint)) UrbanDictionaryAPI.cache.set(paramString, res.list);
            return res.list;
        });
    }

    public static async define(term: string): Promise<Array<UrbanDictionaryData>> {
        const params = new Map([['term', term]]);
        return await UrbanDictionaryAPI.request('define', params);
    }

    public static async random(): Promise<Array<UrbanDictionaryData>> {
        return await UrbanDictionaryAPI.request('random');
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
