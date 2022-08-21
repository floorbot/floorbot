import { APILimiter, APILimiterOptions } from '../../../discord/api/APILimiter.js';
import { RequestOptions } from '../../../discord/api/API.js';
import { Response } from 'node-fetch';
import Bottleneck from 'bottleneck';

export interface BottleneckRequestOptions extends RequestOptions {
    jobOptions?: Bottleneck.JobOptions;
}

export class APIBottleneckLimiter<T extends BottleneckRequestOptions> extends APILimiter<T, Bottleneck> {

    constructor(options: APILimiterOptions<T, Bottleneck>) {
        super(options);
    }

    public async limit(request: T, fetchable: () => Promise<Response>): Promise<Response> {
        const limiter = this.limits[request.endpoint] ?? this.defaultLimit;
        if (limiter) return limiter.schedule(request.jobOptions ?? {}, fetchable);
        return fetchable();
    }
}
