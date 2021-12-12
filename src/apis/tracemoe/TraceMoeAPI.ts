import { TraceMoeResponse } from './interfaces/TraceMoeResponse.js';
import { TraceMoeResult } from './interfaces/TraceMoeResult.js';
import fetch, { Headers } from 'node-fetch';
import Bottleneck from 'bottleneck';
import NodeCache from 'node-cache';
import { Redis } from 'ioredis';

export { TraceMoeResponse, TraceMoeResult };

export interface TraceMoeConstructorOptions {
    readonly apiKey?: string,
    readonly redis: Redis;
    readonly rateLimit?: {
        readonly perMonth: number;
        readonly perMinute: number;
    };
}

export class TraceMoeAPI {

    private static TRACE_MOE_ANILIST_CACHE = new NodeCache({ stdTTL: 60 * 60 });
    private static TRACE_MOE_CACHE = new NodeCache({ stdTTL: 60 * 60 });

    private readonly limiter: Bottleneck;
    private readonly apiKey?: string;

    //free tier is only 60 calls/minute and 1000 calls a month
    constructor(options: TraceMoeConstructorOptions) {
        this.apiKey = options.apiKey;
        const rateLimit = options.rateLimit || { perMonth: 1000, perMinute: 60 };
        let { redis } = options;
        // Creates a monthly (31 day) limit of specified requests (api limits)
        const monthlyLimit = new Bottleneck({
            id: `tracemoe-month`, maxConcurrent: 10, minTime: 0,
            reservoir: Math.floor(rateLimit.perMonth / 31),
            reservoirRefreshInterval: 1000 * 60 * 60 * 24 * 31,
            reservoirRefreshAmount: Math.floor(rateLimit.perMonth / 31)
        });

        // Creates a minutely (60 second) limit of specified requests (api limits)
        this.limiter = new Bottleneck({
            id: `tracemoe-minute`, maxConcurrent: 10, minTime: 0,
            reservoir: rateLimit.perMinute,
            reservoirRefreshInterval: 1000 * 60,
            reservoirRefreshAmount: rateLimit.perMinute,

            highWater: 10, // Same as maxConcurrent
            strategy: Bottleneck.strategy.OVERFLOW,

            ...(redis && redis.options && {
                datastore: 'ioredis',
                clearDatastore: false,
                clientOptions: {
                    host: redis.options.host,
                    port: redis.options.port
                }
            })
        });

        this.limiter.chain(monthlyLimit);
    }

    private getHeaders(): Headers {
        const headers = new Headers();
        if (this.apiKey) headers.set('x-trace-key', this.apiKey);
        return headers;
    }

    private async request(params: [string, string | number | null][]): Promise<any> {
        return this.limiter.schedule(() => {
            const paramString = params.map((param) => `${param[0]}${param[1] !== null ? `=${encodeURIComponent(param[1])}` : ''}`).join('&');
            const url = `https://api.trace.moe/search?${paramString}`;
            const options = { method: 'GET', headers: this.getHeaders() };
            return fetch(url, options).then((res: any) => res.json());
        });
    }

    public async fetchTraceMoeAniListData(url: string): Promise<TraceMoeResponse> {
        const existing = TraceMoeAPI.TRACE_MOE_ANILIST_CACHE.get(url);
        if (existing) return existing as TraceMoeResponse;
        const params: [string, string | number | null][] = [['anilistInfo', null], ['url', url]];
        const res = await this.request(params);
        TraceMoeAPI.TRACE_MOE_ANILIST_CACHE.set(url, res);
        return res as TraceMoeResponse;
    }

    public async fetchTraceMoeData(url: string): Promise<TraceMoeResponse> {
        const existing = TraceMoeAPI.TRACE_MOE_CACHE.get(url);
        if (existing) return existing as TraceMoeResponse;
        const params: [string, string | number | null][] = [['url', url]];
        const res = await this.request(params);
        TraceMoeAPI.TRACE_MOE_CACHE.set(url, res);
        return res as TraceMoeResponse;
    }
}
