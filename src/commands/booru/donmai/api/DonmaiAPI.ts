import { HandlerAPI, HandlerAPIAuth, HandlerAPIRequestUpdates } from '../../../../helpers/HandlerAPI.js';
import DonmaiAPIAutocomplete from './interfaces/DonmaiAPIAutocomplete';
import DonmaiAPIError from './interfaces/DonmaiAPIError';
import DonmaiAPICount from './interfaces/DonmaiAPICount';
import DonmaiAPIPost from './interfaces/DonmaiAPIPost';
import { Redis } from 'ioredis';

export { DonmaiAPIAutocomplete, DonmaiAPIError, DonmaiAPICount, DonmaiAPIPost };

export class DonmaiAPI extends HandlerAPI {

    constructor(options: { subDomain: string, redis: Redis, auth?: HandlerAPIAuth }) {
        const { subDomain, redis, auth } = options;
        super({
            auth: auth,
            url: `https://${subDomain}.donmai.us`,
            limiter: HandlerAPI.createLimiter({
                id: `${subDomain}-api-${auth ? auth.apiKey : 'global'}`,
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

    public async count(tags: string = String(), requestUpdates?: HandlerAPIRequestUpdates): Promise<DonmaiAPICount | DonmaiAPIError> {
        return this.request('counts/posts', [['tags', tags]], requestUpdates);
    }

    public async random(tags: string = String(), requestUpdates?: HandlerAPIRequestUpdates): Promise<DonmaiAPIPost | DonmaiAPIError> {
        return this.request('posts/random', [['tags', tags]], requestUpdates);
    }

    public async autocomplete(tag: string = String(), limit: number = 10, requestUpdates?: HandlerAPIRequestUpdates): Promise<DonmaiAPIAutocomplete[]> {
        return this.request('autocomplete', [
            ['search[query]', tag],
            ['search[type]', 'tag_query'],
            ['limit', limit]
        ], requestUpdates);
    }

    public async get404(): Promise<string> {
        const post = await this.random('pool:16069');
        if ('large_file_url' in post) return post.large_file_url;
        else return 'https://cdn.donmai.us/sample/f1/13/sample-f113114efd070fdd1778cc9ae63f18c8.jpg';
    }

    // A type guard checking if a response is an error
    public static isError(res: any): res is DonmaiAPIError {
        return 'success' in res && res.success === false;
    }
}
