import { DonmaiAPIAutocomplete } from './interfaces/DonmaiAPIAutocomplete.js';
import { API, APIOptions, RequestOptions } from '../../../../discord/api/API.js';
import { DonmaiAPICount } from './interfaces/DonmaiAPICount.js';
import { DonmaiAPIError } from './interfaces/DonmaiAPIError.js';
import { DonmaiAPIPost } from './interfaces/DonmaiAPIPost.js';
import { Headers } from 'node-fetch';

export { DonmaiAPIAutocomplete, DonmaiAPICount, DonmaiAPIError, DonmaiAPIPost };

export type DonmaiAPISubDomain = 'danbooru' | 'safebooru';

export interface DonmaiAPIRequestOptions extends RequestOptions {
    readonly endpoint: 'counts/posts' | 'posts/random' | 'autocomplete';
    readonly params?: (['tags', string] | ['search[query]', string] | ['search[type]', 'tag_query'] | ['limit', number])[];
}

export class DonmaiAPI extends API<DonmaiAPIRequestOptions> {

    public readonly subDomain: DonmaiAPISubDomain;
    private readonly apiKey: string;
    private readonly username: string;
    private readonly userAgent?: string;

    constructor(options: APIOptions<DonmaiAPIRequestOptions> & { subDomain: DonmaiAPISubDomain, apiKey: string, username: string, userAgent?: string; }) {
        super(`https://donmai.us`, options);
        this.subDomain = options.subDomain;
        this.apiKey = options.apiKey;
        this.username = options.username;
        this.userAgent = options.userAgent;
    }

    protected override getURL(request: DonmaiAPIRequestOptions): string {
        const paramString = API.createParamString(request);
        return `https://${this.subDomain}.donmai.us/${request.endpoint}.json?${paramString}`;
    }

    protected override getHeaders(request: DonmaiAPIRequestOptions): Headers {
        const headers = super.getHeaders(request);
        const secret = Buffer.from(`${this.username}:${this.apiKey}`).toString('base64');
        if (this.userAgent) headers.set('User-Agent', this.userAgent);
        headers.set('Authorization', `Basic ${secret}`);
        return headers;
    }

    protected override fetch(request: DonmaiAPIRequestOptions & { type: 'json', endpoint: 'counts/posts'; }): Promise<DonmaiAPICount>;
    protected override fetch(request: DonmaiAPIRequestOptions & { type: 'json', endpoint: 'autocomplete'; }): Promise<DonmaiAPIAutocomplete[]>;
    protected override fetch(request: DonmaiAPIRequestOptions & { type: 'json', endpoint: 'posts/random'; }): Promise<DonmaiAPIPost | DonmaiAPIError>;
    protected override async fetch(request: DonmaiAPIRequestOptions): Promise<unknown> {
        return super.fetch(request);
    }

    public async count(tags: string | null): Promise<DonmaiAPICount> {
        return this.fetch({ endpoint: 'counts/posts', type: 'json', params: [['tags', tags ?? '']] });
    }

    public async random(tags: string | null, force = true): Promise<DonmaiAPIPost | DonmaiAPIError> {
        return this.fetch({ endpoint: 'posts/random', type: 'json', params: [['tags', tags ?? '']], force });
    }

    public async autocomplete(tag: string | null, limit = 10): Promise<DonmaiAPIAutocomplete[]> {
        return this.fetch({
            endpoint: 'autocomplete', type: 'json', params: [
                ['search[query]', tag ?? ''],
                ['search[type]', 'tag_query'],
                ['limit', limit]
            ]
        });
    }

    /** A type guard checking if a response is an error */
    public static isError(res: any): res is DonmaiAPIError {
        return 'success' in res && !res.success;
    }
}
