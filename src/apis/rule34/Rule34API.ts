import { Rule34APIAutocomplete } from './interfaces/Rule34APIAutocomplete';
import { Rule34APIPost } from './interfaces/Rule34APIPost';
import xml2js from 'xml2js';

export { Rule34APIAutocomplete, Rule34APIPost };

export class Rule34API {

    /** Rule34 accessible page limit */
    public static MAX_PAGE: number = 200000

    constructor() {
        // There is no required auth for rule34 api
    }

    private async request(endpoint: string, params?: [string, string | number][]): Promise<Response> {
        const paramString = (params || []).map((param) => `${param[0]}=${param[1]}`).join('&');
        const url = `https://rule34.xxx/${endpoint}.php?${paramString}`;
        const options = { method: 'GET', headers: new Headers() };
        return fetch(url, options);
    }

    public async count(tags: string = String()): Promise<number> {
        const xml = await this.request('index', [['tags', tags], ['limit', 1]]).then(res => res.text());
        const json = await xml2js.parseStringPromise(xml);
        return parseInt(json.posts['$'].count);
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
        }
    }

    public async autocomplete(tag: string = String()): Promise<Rule34APIAutocomplete[]> {
        const json = await this.request('autocomplete', [['q', tag]]).then(res => res.json());
        json.forEach((tag: any) => tag.total = parseInt(/(\d+)\)$/.exec(tag.label)![1]!));
        return json;
    }

    public async get404(): Promise<string> {
        return 'https://rule34.xxx/images/404.gif';
    }
}
