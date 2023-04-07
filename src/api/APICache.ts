import { RequestOptions } from './API.js';

export interface APICacheOptions<T extends RequestOptions> {
    readonly keyable?: APICache<T>['keyable'];
    readonly ttl: APICache<T>['ttl'];
}

export abstract class APICache<T extends RequestOptions> {

    public readonly keyable?: (keyof T)[];
    public readonly ttl: number;

    constructor(options: APICacheOptions<T>) {
        this.keyable = options.keyable;
        this.ttl = options.ttl;
    }

    public abstract set(request: T, value: string, options?: APICacheOptions<T>): Promise<void>;

    public abstract get(request: T): Promise<string | null>;

    public abstract delete(request: T): Promise<void>;

    public getCacheKey(request: T): string {
        if (!this.keyable) return JSON.stringify(request);
        const key = this.keyable.map(key => [key, request[key]]);
        return JSON.stringify(key);
    }
}
