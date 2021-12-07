import { DonmaiAPIAutocomplete } from './interfaces/DonmaiAPIAutocomplete.js';
import { DonmaiAPIError } from './interfaces/DonmaiAPIError.js';
import { DonmaiAPICount } from './interfaces/DonmaiAPICount.js';
import { DonmaiAPIPost } from './interfaces/DonmaiAPIPost.js';
import fetch, { Headers } from 'node-fetch';
import NodeCache from 'node-cache';

export { DonmaiAPIAutocomplete, DonmaiAPIError, DonmaiAPICount, DonmaiAPIPost };

export interface DonmaiAPIAuth {
    username: string;
    apiKey: string;
    userAgent?: string;
}

export class DonmaiAPI {

    private static AUTOCOMPLETE_CACHE = new NodeCache({ stdTTL: 60 * 60 });
    private static COUNT_CACHE = new NodeCache({ stdTTL: 60 * 60 });

    private readonly userAgent: string | null;
    private readonly secret: string | null;
    public readonly subDomain: string;

    constructor(subDomain: string, auth?: DonmaiAPIAuth) {
        this.secret = auth ? Buffer.from(`${auth.username}:${auth.apiKey}`).toString('base64') : null;
        this.userAgent = auth && auth.userAgent ? auth.userAgent : null;
        this.subDomain = subDomain;
    }

    private getHeaders(): Headers {
        const headers = new Headers();
        if (this.secret) headers.set('Authorization', `Basic ${this.secret}`);
        if (this.userAgent) headers.set('User-Agent', this.userAgent);
        return headers;
    }

    private async request(endpoint: string, params?: [string, string | number][]): Promise<any> {
        const paramString = (params || []).map((param) => `${param[0]}=${param[1]}`).join('&');
        const url = `https://${this.subDomain}.donmai.us/${endpoint}.json?${paramString}`;
        const options = { method: 'GET', headers: this.getHeaders() };
        return fetch(url, options).then(res => res.json());
    }

    public async count(tags: string = String()): Promise<DonmaiAPICount | DonmaiAPIError> {
        const cacheKey = tags.toLowerCase();
        const existing = DonmaiAPI.COUNT_CACHE.get(cacheKey);
        if (cacheKey && existing) return existing as DonmaiAPICount | DonmaiAPIError;
        return this.request('counts/posts', [['tags', tags]])
            .then(res => {
                if (cacheKey) DonmaiAPI.COUNT_CACHE.set(cacheKey, res);
                return res;
            });
    }

    public async random(tags: string = String()): Promise<DonmaiAPIPost | DonmaiAPIError> {
        return this.request('posts/random', [['tags', tags]]);
    }

    public async autocomplete(tag: string = String(), limit: number = 10): Promise<DonmaiAPIAutocomplete[]> {
        const cacheKey = `${limit}-${tag.toLowerCase()}`;
        const existing = DonmaiAPI.AUTOCOMPLETE_CACHE.get(cacheKey);
        if (cacheKey && existing) return existing as DonmaiAPIAutocomplete[];
        return this.request('autocomplete', [
            ['search[query]', tag],
            ['search[type]', 'tag_query'],
            ['limit', limit]
        ]).then(res => {
            if (cacheKey) DonmaiAPI.AUTOCOMPLETE_CACHE.set(cacheKey, res);
            return res;
        });
    }

    public async get404(): Promise<string> {
        const post = await this.random('pool:16069');
        if ('large_file_url' in post) return post.large_file_url;
        else return 'https://cdn.donmai.us/sample/f1/13/sample-f113114efd070fdd1778cc9ae63f18c8.jpg';
    }

    /** A type guard checking if a response is an error */
    public static isError(res: any): res is DonmaiAPIError {
        return 'success' in res && res.success === false;
    }
}
