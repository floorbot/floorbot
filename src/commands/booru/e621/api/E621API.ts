import { HandlerAPI, HandlerAPIAuth, HandlerAPIRequestUpdates } from '../../../../discord/helpers/HandlerAPI.js';
import E621APIAutocomplete from './interfaces/E621APIAutocomplete';
import E621APIError from './interfaces/E621APIError';
import E621APIPost from './interfaces/E621APIPost';
import E621APITag from './interfaces/E621APITag';
import { Redis } from 'ioredis';

export { E621APIAutocomplete, E621APIError, E621APIPost, E621APITag };

export class E621API extends HandlerAPI {

    constructor(options: { redis: Redis, auth: HandlerAPIAuth }) {
        const { redis, auth } = options;
        super({
            auth: auth,
            url: `https://e621.net`,
            limiter: HandlerAPI.createLimiter({
                id: `e621-api-${auth ? auth.apiKey : 'global'}`,
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

    public async tags(tags: string = String()): Promise<Array<E621APITag> | E621APIError> {
        return this.request('tags', [['search[name_matches]', tags]]).then((res: any) => res.tags ? res.tags : res)
    }

    public async random(tags: string = String()): Promise<E621APIPost | E621APIError> {
        const res: any = await this.request('posts/random', [['tags', tags]]);
        return res.post ? res.post : res;
    }

    public async autocomplete(tag = String()): Promise<E621APIAutocomplete[]> {
        return this.request('tags/autocomplete', [['search[name_matches]', tag]]);
    }

    public async get404(): Promise<string> {
        const post = await this.random('pool:16069');
        if ('file' in post) return post.file.url;
        else return 'https://cdn.e621.us/sample/f1/13/sample-f113114efd070fdd1778cc9ae63f18c8.jpg';
    }

    // A type guard checking if a response is an error
    public static isError(res: any): res is E621APIError {
        return 'success' in res && res.success === false;
    }
}
