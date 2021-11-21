import { HandlerAPI, HandlerAPIRequestUpdates } from '../../../helpers/HandlerAPI.js';
import CacheMap from 'cache-map';
import { Redis } from 'ioredis';


export class UrbanDictionaryAPI extends HandlerAPI {

    private autocompleteCache: CacheMap<string, UrbanDictionaryAPIAutocomplete[]>;
    private defineCache: CacheMap<string, UrbanDictionaryAPIData[]>;

    constructor(redis: Redis) {
        super({
            url: `http://api.urbandictionary.com/v0`,
            limiter: HandlerAPI.createLimiter({
                id: `urbandictionary-api`,
                maxConcurrent: 10,
                perSecond: 10,
                redis: redis
            })
        });
        this.autocompleteCache = new CacheMap({ ttl: 1000 * 60 * 60 });
        this.defineCache = new CacheMap({ ttl: 1000 * 60 * 60 });
    }

    protected override async request(endpoint: string, params?: [string, string | number][], requestUpdates?: HandlerAPIRequestUpdates): Promise<any> {
        return super.request(endpoint, params, requestUpdates).then(res => res.json());
    }

    public async define(term: string): Promise<UrbanDictionaryAPIData[]> {
        const existing = this.defineCache.get(term.toLowerCase());
        if (existing) return existing;
        return await this.request('define', [['term', term]])
            .then(res => { return res.list ?? []})
            .then(res => {
                this.defineCache.set(term.toLowerCase(), res);
                return res;
            });
    }

    public async random(): Promise<UrbanDictionaryAPIData[]> {
        return await this.request('random').then(res => res.list ?? []);
    }

    public async autocomplete(term: string): Promise<UrbanDictionaryAPIAutocomplete[]> {
        const existing = this.autocompleteCache.get(term.toLowerCase());
        if (existing) return existing;
        return await this.request('autocomplete-extra', [['term', term]])
            .then(res => res.results ?? [])
            .then(res => {
                this.autocompleteCache.set(term.toLowerCase(), res);
                return res;
            });
    }
}

export interface UrbanDictionaryAPIAutocomplete {
    readonly preview: string,
    readonly term: string
}

export interface UrbanDictionaryAPIData {
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
