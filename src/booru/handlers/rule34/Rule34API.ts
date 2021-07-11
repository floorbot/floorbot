import { Response } from 'node-fetch';
import * as xml2js from 'xml2js';
import fetch from 'node-fetch';

export class Rule34API {

    // Rule34 accessible page limit
    public static MAX_PAGE: number = 200000

    private static async request(endpoint: string, params: Map<string, string | number>, options: object = {}): Promise<Response> {
        options = Object.assign({ method: 'GET' }, options)
        if (!params.has('page')) params.set('page', 'dapi');
        if (!params.has('s')) params.set('s', 'post');
        if (!params.has('q')) params.set('q', 'index');
        const paramString: string = Array.from(params).map((param: Array<string | number>) => `${param[0]}=${param[1]}`).join('&');
        const url: string = `https://rule34.xxx/${endpoint}.php?${paramString}`;
        return fetch(url, options);
    }

    public static async count(tags: string = String()): Promise<number> {
        const params = new Map<string, string | number>([['tags', tags], ['limit', 1]]);
        const xml = await Rule34API.request('index', params).then(res => res.text());
        const json = await xml2js.parseStringPromise(xml);
        return parseInt(json.posts['$'].count);
    }

    public static async random(tags: string = String()): Promise<Rule34APIPost | null> {
        const total = await Rule34API.count(tags);
        const pid = Math.min(total, Rule34API.MAX_PAGE) * Math.random() << 0;
        const params = new Map<string, string | number>([['pid', pid], ['limit', 1], ['tags', tags]]);
        const xml = await Rule34API.request('index', params).then(res => res.text());
        const json = await xml2js.parseStringPromise(xml);
        if (!json.posts.post) return null;
        return {
            count: {
                total: json.posts['$'].count,
                offset: json.posts['$'].offset
            },
            ...json.posts.post[0]['$']
        }
    }

    public static async autocomplete(tag: string = String()): Promise<Array<Rule34APIAutocomplete>> {
        const params = new Map<string, string | number>([['q', tag]]);
        const json = await Rule34API.request('autocomplete', params).then(res => res.json());
        json.forEach((tag: any) => tag.total = parseInt(/(\d+)\)$/.exec(tag.label)![1]));
        return json;
    }

    public static async get404(): Promise<string> {
        return 'https://rule34.xxx/images/404.gif';
    }
}

export interface Rule34APIAutocomplete {
    readonly label: string,
    readonly value: string,
    readonly total: number
}

export interface Rule34APIPost {
    readonly count: {
        readonly total: number,
        readonly offset: number
    }
    readonly height: string,
    readonly score: string,
    readonly file_url: string,
    readonly parent_id: string,
    readonly sample_url: string,
    readonly sample_width: string,
    readonly sample_height: string,
    readonly preview_url: string,
    readonly rating: string,
    readonly tags: string,
    readonly id: string,
    readonly width: string,
    readonly change: string,
    readonly md5: string,
    readonly creator_id: string,
    readonly has_children: string,
    readonly created_at: string,
    readonly status: string,
    readonly source: string,
    readonly has_notes: string,
    readonly has_comments: string,
    readonly preview_width: string,
    readonly preview_height: string,
}
