import { UrbanDictionaryAPIAutocomplete } from './interfaces/UrbanDictionaryAPIAutocomplete.js';
import { UrbanDictionaryAPIData } from './interfaces/UrbanDictionaryAPIData.js';
import fetch, { Headers } from 'node-fetch';
import NodeCache from 'node-cache';

export { UrbanDictionaryAPIAutocomplete, UrbanDictionaryAPIData };

export class UrbanDictionaryAPI {

    private static AUTOCOMPLETE_CACHE = new NodeCache({ stdTTL: 60 * 60 });
    private static DEFINE_CACHE = new NodeCache({ stdTTL: 60 * 60 });

    private async request(endpoint: string, params?: [string, string | number][]): Promise<any> {
        const paramString = (params || []).map((param) => `${param[0]}=${param[1]}`).join('&');
        const url = `http://api.urbandictionary.com/v0/${endpoint}?${paramString}`;
        const options = { method: 'GET', headers: new Headers() };
        return fetch(url, options).then(res => res.json());
    }

    public async random(): Promise<UrbanDictionaryAPIData[]> {
        return await this.request('random').then(res => res.list ?? []);
    }

    public async define(term: string): Promise<UrbanDictionaryAPIData[]> {
        const existing = UrbanDictionaryAPI.DEFINE_CACHE.get(term.toLowerCase());
        if (existing) return existing as UrbanDictionaryAPIData[];
        return await this.request('define', [['term', term]])
            .then(res => { return res.list ?? []})
            .then(res => {
                UrbanDictionaryAPI.DEFINE_CACHE.set(term.toLowerCase(), res);
                return res;
            });
    }

    public async autocomplete(term: string): Promise<UrbanDictionaryAPIAutocomplete[]> {
        const existing = UrbanDictionaryAPI.AUTOCOMPLETE_CACHE.get(term.toLowerCase());
        if (existing) return existing as UrbanDictionaryAPIAutocomplete[];
        return await this.request('autocomplete-extra', [['term', term]])
            .then(res => res.results ?? [])
            .then(res => {
                UrbanDictionaryAPI.AUTOCOMPLETE_CACHE.set(term.toLowerCase(), res);
                return res;
            });
    }
}
