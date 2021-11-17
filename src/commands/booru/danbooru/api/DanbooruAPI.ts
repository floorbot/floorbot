import { HandlerAPI, HandlerAPIAuth, HandlerAPIRequestUpdates } from '../../../../helpers/HandlerAPI.js';
import DanbooruAPIAutocomplete from './interfaces/DanbooruAPIAutocomplete';
import DanbooruAPIError from './interfaces/DanbooruAPIError';
import DanbooruAPICount from './interfaces/DanbooruAPICount';
import DanbooruAPIPost from './interfaces/DanbooruAPIPost';
import { Redis } from 'ioredis';

export { DanbooruAPIAutocomplete, DanbooruAPIError, DanbooruAPICount, DanbooruAPIPost };

export class DanbooruAPI extends HandlerAPI {

    constructor(options: { redis: Redis, auth?: HandlerAPIAuth }) {
        const { redis, auth } = options;
        super({
            auth: auth,
            url: 'https://danbooru.donmai.us',
            limiter: HandlerAPI.createLimiter({
                id: `danbooru-api-${auth ? auth.apiKey : 'global'}`,
                maxConcurrent: 10,
                perSecond: 10,
                redis: redis
            })
        });
    }

    protected override getRequestURL(endpoint: string, paramString: string) {
        return `${this.url}/${endpoint}.json?${paramString}`
    }

    protected override async request(endpoint: string, params: [string, string | number][], requestUpdates?: HandlerAPIRequestUpdates): Promise<any> {
        return super.request(endpoint, params, requestUpdates).then(res => res.json());
    }

    public async count(tags: string = String(), requestUpdates?: HandlerAPIRequestUpdates): Promise<DanbooruAPICount | DanbooruAPIError> {
        return this.request('counts/posts', [['tags', tags]], requestUpdates);
    }

    public async random(tags: string = String(), requestUpdates?: HandlerAPIRequestUpdates): Promise<DanbooruAPIPost | DanbooruAPIError> {
        return this.request('posts/random', [['tags', tags]], requestUpdates);
    }

    public async autocomplete(tag: string = String(), limit: number = 10, requestUpdates?: HandlerAPIRequestUpdates): Promise<DanbooruAPIAutocomplete[]> {
        return this.request('autocomplete', [
            ['search[query]', tag],
            ['search[type]', 'tag_query'],
            ['limit', limit]
        ], requestUpdates);
    }

    public async get404(): Promise<string> {
        const data = await this.random('pool:16069');
        if ('large_file_url' in data) return data.large_file_url;
        else return 'https://cdn.donmai.us/sample/f1/13/sample-f113114efd070fdd1778cc9ae63f18c8.jpg';
    }

    // A type guard checking if a response is an error
    public static isError(res: any): res is DanbooruAPIError {
        return 'success' in res && res.success === false;
    }
}
