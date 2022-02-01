import { ActivityVariables } from './interfaces/Activity.js';
import { AniListResponse } from './interfaces/Common';
import { MediaVariables } from './interfaces/Media';
import Bottleneck from 'bottleneck';
import NodeCache from 'node-cache';
import { Redis } from 'ioredis';
import fetch from 'node-fetch';

export * from './interfaces/Common.js';

// THESE ARE COMPLETED TYPES (EXCLUDING QUERY VARS)
export * from './interfaces/Character.js';
export * from './interfaces/Activity.js';
export * from './interfaces/Studio.js';
export * from './interfaces/Media.js';
export * from './interfaces/Staff.js';
export * from './interfaces/User.js';
export * from './interfaces/Page.js';

export type QueryVars = MediaVariables & ActivityVariables & {
    page?: number;
    perPage?: number;
};

export interface AniListAPIConstructorOptions {
    readonly redis: Redis,
    readonly rateLimit?: {
        readonly reservoir: number;
        readonly refresh: number;
    };
}

export type AniListAPIRequest = (variables: QueryVars) => Promise<AniListResponse>;

export class AniListAPI {

    private readonly limiter: Bottleneck;

    constructor(options: AniListAPIConstructorOptions) {
        const { redis, rateLimit } = options;
        const reservoir = rateLimit ? rateLimit.reservoir : 90;
        const reservoirRefreshInterval = rateLimit ? rateLimit.refresh : 1000 * 60;

        this.limiter = new Bottleneck({
            id: 'anilist-api',
            maxConcurrent: 10,

            reservoir: reservoir,
            reservoirRefreshInterval: reservoirRefreshInterval,
            reservoirRefreshAmount: reservoir,

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
    }

    public async request(query: string, variables: QueryVars): Promise<AniListResponse> {
        return this.limiter.schedule({ expiration: 5000 }, () => {
            return fetch(`https://graphql.anilist.co`, {
                method: 'POST',
                body: JSON.stringify({ query: query, variables: variables }),
                headers: { 'Content-Type': 'application/json' },
            }).then(res => res.json());
        });
    }

    /** Create a request function with predefined gql with caching */
    public prepareRequest(query: string): AniListAPIRequest {
        const cache = new NodeCache({ stdTTL: 60 * 60 }); // 1 hour ttl
        return async (variables: QueryVars) => {
            const cacheKey = JSON.stringify(variables);
            const existing = cache.get(cacheKey);
            if (existing) return existing as AniListResponse;
            const res = this.request(query, variables);
            cache.set(cacheKey, res);
            return res;
        };
    }
}
