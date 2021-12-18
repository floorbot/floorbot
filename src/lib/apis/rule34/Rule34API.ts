import { Rule34APIAutocomplete } from './interfaces/Rule34APIAutocomplete.js';
import { Rule34APIPost } from './interfaces/Rule34APIPost.js';
import fetch, { Headers, Response } from 'node-fetch';
import NodeCache from 'node-cache';
import xml2js from 'xml2js';

export { Rule34APIAutocomplete, Rule34APIPost };

export class Rule34API {

    /** Rule34 accessible page limit */
    public static MAX_PAGE: number = 200000;

    private static AUTOCOMPLETE_CACHE = new NodeCache({ stdTTL: 60 * 60 });
    private static COUNT_CACHE = new NodeCache({ stdTTL: 60 * 60 });

    private async request(endpoint: string, params: [string, string | number][]): Promise<Response> {
        const defaultParams: [string, string | number][] = [['page', 'dapi'], ['s', 'post'], ['q', 'index']];
        const paramString = defaultParams.concat(params).map((param) => `${param[0]}=${param[1]}`).join('&');
        const url = `https://api.rule34.xxx/${endpoint}.php?${paramString}`;
        const options = { method: 'GET', headers: new Headers() };
        return fetch(url, options);
    }

    public async random(tags: string = String()): Promise<Rule34APIPost | null> {
        const total = await this.count(tags);
        const pid = Math.min(total, Rule34API.MAX_PAGE) * Math.random() << 0;
        const xml = await this.request('index', [['pid', pid], ['limit', 1], ['tags', tags]]).then(res => res.text());
        const json = await xml2js.parseStringPromise(xml);
        if (!json.posts.post) return null;
        return {
            count: {
                total: json.posts['$'].count,
                offset: json.posts['$'].offset
            },
            ...json.posts.post[0]['$']
        };
    }

    public async count(tags: string = String()): Promise<number> {
        const cacheKey = tags.toLowerCase();
        const existing = Rule34API.COUNT_CACHE.get(cacheKey);
        if (cacheKey && existing) return existing as number;
        const xml = await this.request('index', [['tags', tags], ['limit', 1]]).then(res => res.text());
        const json = await xml2js.parseStringPromise(xml);
        const count = parseInt(json.posts['$'].count);
        if (cacheKey) Rule34API.COUNT_CACHE.set(cacheKey, count);
        return count;
    }

    public async autocomplete(tag: string = String()): Promise<Rule34APIAutocomplete[]> {
        const cacheKey = tag.toLowerCase();
        const existing = Rule34API.AUTOCOMPLETE_CACHE.get(cacheKey);
        if (cacheKey && existing) return existing as Rule34APIAutocomplete[];
        const json = await this.request('autocomplete', [['q', tag]]).then(res => res.json());
        json.forEach((tag: any) => tag.total = parseInt(/(\d+)\)$/.exec(tag.label)![1]!));
        if (cacheKey) Rule34API.AUTOCOMPLETE_CACHE.set(cacheKey, json);
        return json;
    }

    public async get404(): Promise<string> {
        return 'https://rule34.xxx/images/404.gif';
    }
}
