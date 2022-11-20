import { Headers } from 'node-fetch';
import { API, APIOptions, RequestOptions } from '../../../../core/api/API.js';
import { APICacheOptions } from '../../../../core/api/APICache.js';
import { E621APIAutocomplete } from './interfaces/E621APIAutocomplete.js';
import { E621APIError } from './interfaces/E621APIError.js';
import { E621APIPost } from './interfaces/E621APIPost.js';
import { E621APITag } from './interfaces/E621APITag.js';

export { E621APIAutocomplete, E621APIError, E621APIPost, E621APITag };

export interface E621APIRequestOptions extends RequestOptions {
    readonly endpoint: 'tags' | 'posts/random' | 'tags/autocomplete';
    readonly params?: (['tags', string] | ['search[name_matches]', string])[];
}

export class E621API extends API<E621APIRequestOptions> {

    private readonly apiKey: string;
    private readonly username: string;
    private readonly userAgent: string;

    constructor(options: APIOptions<E621APIRequestOptions> & { apiKey: string, username: string, userAgent: string; }) {
        super(`https://e621.net`, options);
        this.apiKey = options.apiKey;
        this.username = options.username;
        this.userAgent = options.userAgent;
    }

    protected override getURL(request: E621APIRequestOptions): string {
        const paramString = API.createParamString(request);
        return `${this.url}/${request.endpoint}.json?${paramString}`;
    }

    protected override getHeaders(request: E621APIRequestOptions): Headers {
        const headers = super.getHeaders(request);
        const secret = Buffer.from(`${this.username}:${this.apiKey}`).toString('base64');
        headers.set('Authorization', `Basic ${secret}`);
        headers.set('User-Agent', this.userAgent);
        return headers;
    }

    protected override fetch(request: E621APIRequestOptions & { type: 'json', endpoint: 'tags'; }, cacheOptions?: APICacheOptions<E621APIRequestOptions>): Promise<E621APITag[]>;
    protected override fetch(request: E621APIRequestOptions & { type: 'json', endpoint: 'posts/random'; }, cacheOptions?: APICacheOptions<E621APIRequestOptions>): Promise<{ post: E621APIPost; } | E621APIError>;
    protected override fetch(request: E621APIRequestOptions & { type: 'json', endpoint: 'tags/autocomplete'; }, cacheOptions?: APICacheOptions<E621APIRequestOptions>): Promise<E621APIAutocomplete[] | E621APIError>;
    protected override async fetch(request: E621APIRequestOptions, cacheOptions?: APICacheOptions<E621APIRequestOptions>): Promise<unknown> {
        return super.fetch(request, cacheOptions);
    }

    public async tags(tags: string | null): Promise<E621APITag[]> {
        return this.fetch({ endpoint: 'tags', type: 'json', params: [['search[name_matches]', tags ?? '']] });
    }

    public async random(tags: string | null, force = true): Promise<E621APIPost | E621APIError> {
        const res = await this.fetch({ endpoint: 'posts/random', type: 'json', params: [['tags', tags ?? '']], force });
        return E621API.isError(res) ? res : res.post;
    }

    public async autocomplete(tag: string | null): Promise<E621APIAutocomplete[] | E621APIError> {
        return this.fetch({ endpoint: 'tags/autocomplete', type: 'json', params: [['search[name_matches]', tag ?? '']] });
    }

    /** A type guard checking if a response is an error */
    public static isError(res: any): res is E621APIError {
        return ('success' in res && res.success === false) || 'error' in res;
    }
}
