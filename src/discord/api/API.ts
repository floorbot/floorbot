import fetch, { BodyInit, Headers, HeadersInit } from 'node-fetch';
import { APICache, APICacheOptions } from './APICache.js';
import { APILimiter } from './APILimiter.js';

export interface RequestOptions {
    readonly type: 'json' | 'text';
    readonly endpoint: string;
    readonly params?: [string, string | number][];
    readonly method?: string;
    readonly body?: BodyInit;
    readonly headers?: HeadersInit;
    readonly force?: boolean;
}

export interface RequestCacheOptions<T extends RequestOptions> {
    keyable?: (keyof T)[];
    ttl?: number;
}

export interface RequestContext<T extends RequestOptions, C extends RequestCacheOptions<T>> {
    readonly requestOptions: T;
    readonly cacheOptions?: C;
}

export interface APIOptions<T extends RequestOptions> {
    readonly limiter?: APILimiter<T>,
    readonly cache?: APICache<T>;
}

export abstract class API<T extends RequestOptions> {

    public readonly limiter?: APILimiter<T>;
    public readonly cache?: APICache<T>;
    public readonly url: string;

    constructor(url: string, options?: APIOptions<T>) {
        options = options ?? {};
        this.limiter = options.limiter;
        this.cache = options.cache;
        this.url = url;
    }

    protected getURL(request: T): string {
        const paramString = API.createParamString(request);
        return `${this.url}/${request.endpoint}?${paramString}`;
    }

    protected getBody(request: T): BodyInit | null {
        return request.body ?? null;
    }

    protected getHeaders(request: T): Headers {
        return new Headers(request.headers);
    }

    protected async fetch(request: T, cacheOptions?: APICacheOptions<T>): Promise<unknown> {

        // Check and return cache if present
        if (!request.force) {
            const existing = this.cache ? await this.cache.get(request) : null;
            if (existing) return request.type === 'json' ? JSON.parse(existing) : existing;
        }

        // Make API request with specified limiter
        const fetchable = () => fetch(this.getURL(request), {
            method: request.method,
            body: this.getBody(request) ?? undefined,
            headers: this.getHeaders(request)
        });

        const response = this.limiter ?
            await this.limiter.limit(request, fetchable) :
            await fetchable();

        // Save to cache and return data
        const data = request.type === 'json' ? await response.json() : await response.text();
        if (this.cache) this.cache.set(request, typeof data === 'string' ? data : JSON.stringify(data), cacheOptions);
        return data;
    }

    public static createParamString<T extends RequestOptions>(request: T): string {
        return (request.params ?? []).map((param) => `${param[0]}=${encodeURIComponent(param[1])}`).join('&');
    }
}
