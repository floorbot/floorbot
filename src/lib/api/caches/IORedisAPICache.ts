import { APICache, APICacheOptions } from '../APICache.js';
import { RequestOptions } from '../API.js';
import { Redis } from 'ioredis-mock';

export interface IORedisAPICacheOptions<T extends RequestOptions> extends APICacheOptions<T> {
    redis: Redis;
}

export class IORedisAPICache<T extends RequestOptions> extends APICache<T> {

    public readonly redis: Redis;

    constructor(options: IORedisAPICacheOptions<T>) {
        super(options);
        this.redis = options.redis;
    }

    public async set(request: T, value: string, options?: APICacheOptions<T>): Promise<void> {
        const ttl = { ttl: this.ttl, ...options }.ttl;
        const key = this.getCacheKey(request);
        await this.redis.set(key, value, 'PX', ttl);
    }

    public async get(request: T): Promise<string | null> {
        const key = this.getCacheKey(request);
        return await this.redis.get(key);
    }

    public async delete(request: T): Promise<void> {
        const key = this.getCacheKey(request);
        await this.redis.del(key);
    }
}
