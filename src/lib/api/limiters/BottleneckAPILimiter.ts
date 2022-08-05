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
        console.log('yeah ew need to add joboptions to request limiter');
        console.log('we also need to check for default limits if not found...');
        // if (limiter) return limiter.schedule(jobOptions fetchable); //expiration...
        if (limiter) return limiter.schedule(fetchable);
        return fetchable();
    }
}
