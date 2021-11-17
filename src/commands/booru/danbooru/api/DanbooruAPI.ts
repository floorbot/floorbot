import DanbooruAPIAutocomplete from './interfaces/DanbooruAPIAutocomplete';
import DanbooruAPIError from './interfaces/DanbooruAPIError';
import DanbooruAPICount from './interfaces/DanbooruAPICount';
import DanbooruAPIPost from './interfaces/DanbooruAPIPost';
import fetch, { Headers } from 'node-fetch';
import Bottleneck from 'bottleneck';
import { Redis } from 'ioredis';

export { DanbooruAPIAutocomplete, DanbooruAPIError, DanbooruAPICount, DanbooruAPIPost };

export interface DanbooruAPIConstructorOptions {
    auth?: { username: string, apiKey: string },
    redis: Redis,
    limits?: {
        maxConcurrent: number,
        perSecond: number
    }
}

export interface DanbooruAPIRequestUpdates {
    onRetry?: (retryCount: number, retryIn: number, error: any) => any,
    onReceived?: (jobInfo: Bottleneck.EventInfo) => any,
    onQueued?: (jobInfo: Bottleneck.EventInfoQueued) => any,
    onScheduled?: (jobInfo: Bottleneck.EventInfo) => any,
    onExecuting?: (jobInfo: Bottleneck.EventInfo) => any,
    onDone?: (jobInfo: Bottleneck.EventInfo) => any
}

export class DanbooruAPI {

    private readonly secret: string | null;
    private readonly limiter: Bottleneck;

    constructor(options: DanbooruAPIConstructorOptions) {
        options.limits = options.limits || { maxConcurrent: 10, perSecond: 10 };
        const { auth, redis, limits } = options;
        this.secret = auth ? Buffer.from(`${auth.username}:${auth.apiKey}`).toString('base64') : null;
        this.limiter = new Bottleneck({
            id: `danbooru-api-${this.secret || 'global'}`,
            maxConcurrent: limits.maxConcurrent,
            minTime: 1000 / limits.perSecond,
            reservoir: 5 * (limits.perSecond),
            reservoirRefreshInterval: 5 * (1000),
            reservoirRefreshAmount: 5 * (limits.perSecond),
            highWater: limits.maxConcurrent,
            strategy: Bottleneck.strategy.OVERFLOW,
            ...(redis.options && {
                datastore: 'ioredis',
                clearDatastore: false,
                clientOptions: {
                    host: redis.options.host,
                    port: redis.options.port
                }
            })
        });
        this.limiter.on('failed', async (error, jobInfo) => {
            if (jobInfo.retryCount >= 3) return; // Total of 3 retries
            const requestUpdates = jobInfo.args[0] as DanbooruAPIRequestUpdates | undefined;
            const retryIn = 1000 * Math.pow(2, jobInfo.retryCount); // 2^n seconds
            if (requestUpdates && requestUpdates.onRetry) requestUpdates.onRetry(jobInfo.retryCount + 1, retryIn, error);
            return retryIn;
        });
        this.limiter.on('received', async (jobInfo) => {
            const requestUpdates = jobInfo.args[0] as DanbooruAPIRequestUpdates | undefined;
            if (requestUpdates && requestUpdates.onReceived) requestUpdates.onReceived(jobInfo);
        });
        this.limiter.on('queued', async (jobInfo) => {
            const requestUpdates = jobInfo.args[0] as DanbooruAPIRequestUpdates | undefined;
            if (requestUpdates && requestUpdates.onQueued) requestUpdates.onQueued(jobInfo);
        });
        this.limiter.on('scheduled', async (jobInfo) => {
            const requestUpdates = jobInfo.args[0] as DanbooruAPIRequestUpdates | undefined;
            if (requestUpdates && requestUpdates.onScheduled) requestUpdates.onScheduled(jobInfo);
        });
        this.limiter.on('executing', async (jobInfo) => {
            const requestUpdates = jobInfo.args[0] as DanbooruAPIRequestUpdates | undefined;
            if (requestUpdates && requestUpdates.onExecuting) requestUpdates.onExecuting(jobInfo);
        });
        this.limiter.on('done', async (jobInfo) => {
            const requestUpdates = jobInfo.args[0] as DanbooruAPIRequestUpdates | undefined;
            if (requestUpdates && requestUpdates.onDone) requestUpdates.onDone(jobInfo);
        });

    }

    private getHeaders(): Headers {
        const headers = new Headers();
        if (this.secret) headers.set('Authorization', `Basic ${this.secret}`);
        return headers;
    }

    private async request(endpoint: string, params: [string, string | number][], requestUpdates?: DanbooruAPIRequestUpdates): Promise<any> {
        return this.limiter.schedule({ expiration: 2500 }, async () => {
            const paramString = params.map((param) => `${param[0]}=${param[1]}`).join('&');
            const url = `https://danbooru.donmai.us/${endpoint}.json?${paramString}`;
            const options = { method: 'GET', headers: this.getHeaders() };
            return fetch(url, options).then((res: any) => res.json());
        }, requestUpdates);
    }

    public async count(tags: string = String(), requestUpdates?: DanbooruAPIRequestUpdates): Promise<DanbooruAPICount | DanbooruAPIError> {
        return this.request('counts/posts', [['tags', tags]], requestUpdates);
    }

    public async random(tags: string = String(), requestUpdates?: DanbooruAPIRequestUpdates): Promise<DanbooruAPIPost | DanbooruAPIError> {
        return this.request('posts/random', [['tags', tags]], requestUpdates);
    }

    public async autocomplete(tag: string = String(), limit: number = 10, requestUpdates?: DanbooruAPIRequestUpdates): Promise<DanbooruAPIAutocomplete[]> {
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
