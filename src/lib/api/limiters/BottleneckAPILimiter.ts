import { APILimiter, APILimiterOptions } from '../APILimiter.js';
import { RequestOptions } from '../API.js';
import { Response } from 'node-fetch';
import Bottleneck from 'bottleneck';

export class APIBottleneckLimiter<T extends RequestOptions> extends APILimiter<T, Bottleneck> {

    constructor(options: APILimiterOptions<T, Bottleneck>) {
        const created = options;
        super(created);
    }

    public async limit(request: T, fetchable: () => Promise<Response>): Promise<Response> {
        const limiter = this.limits[request.endpoint];
        // if (limiter) return limiter.schedule(jobOptions, fetchable);
        if (limiter) return fetchable();
        return fetchable();
    }
}
