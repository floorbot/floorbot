import CacheMap from 'cache-map.js';
import fetch from 'node-fetch';

export class UrbanDictionaryAPI {

    private static cache: CacheMap<string, UrbanDictionaryData[] | UrbanDictionaryAutocomplete> = new CacheMap({ ttl: 1000 * 60 * 60 });

    private static async request(endpoint: string, params: Map<string, string> = new Map(), options: Object = {}) {
        options = Object.assign({ method: 'GET' }, options)
        const paramString: string = Array.from(params).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');
        const url: string = `http://api.urbandictionary.com/v0/${endpoint}?${paramString}`;
        const existing = UrbanDictionaryAPI.cache.get(paramString);
        return existing || fetch(url, options).then((res) => res.json()).then(res => {
            if (['define', 'autocomplete-extra'].includes(endpoint)) UrbanDictionaryAPI.cache.set(paramString, res);
            return res;
        });
    }

    public static async define(term: string): Promise<UrbanDictionaryData[]> {
        const params = new Map([['term', term]]);
        return await UrbanDictionaryAPI.request('define', params).then(res => res.list);
    }

    public static async random(): Promise<UrbanDictionaryData[]> {
        return await UrbanDictionaryAPI.request('random').then(res => res.list);
    }

    public static async autocomplete(term: string): Promise<UrbanDictionaryAutocomplete[]> {
        const params = new Map([['term', term]]);
        return await UrbanDictionaryAPI.request('autocomplete-extra', params).then(res => res.results);
    }
}

export interface UrbanDictionaryAutocomplete {
    readonly preview: string,
    readonly term: string
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
