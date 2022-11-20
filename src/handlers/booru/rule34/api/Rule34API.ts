import xml2js from 'xml2js';
import { API, APIOptions, RequestOptions } from '../../../../core/api/API.js';
import { Rule34APIAutocomplete } from './interfaces/Rule34APIAutocomplete.js';
import { Rule34APIPost } from './interfaces/Rule34APIPost.js';

export { Rule34APIAutocomplete, Rule34APIPost };

export interface Rule34APIRequestOptions extends RequestOptions {
    readonly endpoint: 'index' | 'autocomplete';
    readonly params?: (['page', 'dapi'] | ['s', 'post'] | ['q', 'index' | string] | ['pid', number] | ['limit', number] | ['tags', string] | ['json', 1])[];
}

export class Rule34API extends API<Rule34APIRequestOptions> {

    /** Rule34 accessible page limit */
    public static MAX_PAGE = 200000;

    constructor(options?: APIOptions<Rule34APIRequestOptions>) {
        super(`https://api.rule34.xxx`, options);
    }

    protected override getURL(request: Rule34APIRequestOptions): string {
        const paramString = API.createParamString(request);
        return `${this.url}/${request.endpoint}.php?${paramString}`;
    }

    /** PLEASE NOTE ARGUMENT "json=1" DOES NOT GET POST COUNTS */
    protected override fetch(request: Rule34APIRequestOptions & { type: 'text', endpoint: 'index'; }): Promise<string>;
    protected override fetch(request: Rule34APIRequestOptions & { type: 'text', endpoint: 'index'; }): Promise<Rule34APIPost>;
    protected override fetch(request: Rule34APIRequestOptions & { type: 'json', endpoint: 'autocomplete'; }): Promise<Exclude<Rule34APIAutocomplete, 'total'>[]>;
    protected override async fetch(request: Rule34APIRequestOptions): Promise<unknown> {
        return super.fetch(request);
    }

    /** Using XML to get the post count info */
    public async count(tags: string | null): Promise<number> {
        const xml = await this.fetch({
            endpoint: 'index', type: 'text', params: [
                ['page', 'dapi'],
                ['s', 'post'],
                ['q', 'index'],
                ['tags', tags ?? ''],
                ['limit', 1]
            ]
        });
        const json = await xml2js.parseStringPromise(xml);
        return parseInt(json.posts['$'].count);
    }

    /** Using XML to get the post count info */
    public async random(tags: string | null): Promise<Rule34APIPost | null> {
        const total = await this.count(tags);
        const pid = Math.min(total, Rule34API.MAX_PAGE) * Math.random() << 0;
        const xml = await this.fetch({
            endpoint: 'index', type: 'text', params: [
                ['page', 'dapi'],
                ['s', 'post'],
                ['q', 'index'],
                ['pid', pid],
                ['tags', tags ?? ''],
                ['limit', 1],
            ]
        });
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

    public async autocomplete(tag: string | null): Promise<(Rule34APIAutocomplete)[]> {
        const suggestions = await this.fetch({
            endpoint: 'autocomplete', type: 'json', params: [
                ['page', 'dapi'],
                ['s', 'post'],
                ['q', tag ?? '']]
        });
        return suggestions.map(suggestion => {
            const total = parseInt(/(\d+)\)$/.exec(suggestion.label)?.[1] ?? '');
            return { ...suggestion, total: total };
        });
    }
}
