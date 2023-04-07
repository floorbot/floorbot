import { Response } from 'node-fetch';
import { RequestOptions } from './API.js';

export interface APILimiterOptions<T extends RequestOptions, L = {}> {
    readonly defaultLimit?: APILimiter<T, L>['defaultLimit'];
    readonly limits: APILimiter<T, L>['limits'];
}

export abstract class APILimiter<T extends RequestOptions, L = {}> {

    public readonly defaultLimit?: L;
    public readonly limits: { [key in T['endpoint']]?: L; } & { [key: string]: L; };
    // public readonly limits: { [key in T['endpoint']]: L; };

    constructor(options: APILimiterOptions<T, L>) {
        this.defaultLimit = options.defaultLimit;
        this.limits = options.limits;
    }

    public abstract limit(request: T, fetchable: () => Promise<Response>): Promise<Response>;
}
