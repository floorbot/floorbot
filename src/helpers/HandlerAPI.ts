import fetch, { Headers, Response } from 'node-fetch';
import Bottleneck from 'bottleneck';
import { Redis } from 'ioredis';

export interface HandlerAPIAuth {
    username: string,
    apiKey: string,
    userAgent?: string
}

export interface HandlerAPIConstructorOptions {
    auth?: HandlerAPIAuth,
    limiter: Bottleneck,
    expiration?: number,
    retryLimit?: number,
    url: string,
}

export interface HandlerAPIRequestUpdates {
    onRetry?: (retryCount: number, retryIn: number, error: any) => any,
    onReceived?: (jobInfo: Bottleneck.EventInfo) => any,
    onQueued?: (jobInfo: Bottleneck.EventInfoQueued) => any,
    onScheduled?: (jobInfo: Bottleneck.EventInfo) => any,
    onExecuting?: (jobInfo: Bottleneck.EventInfo) => any,
    onDone?: (jobInfo: Bottleneck.EventInfo) => any
}

export abstract class HandlerAPI {

    protected readonly userAgent: string | null;
    protected readonly secret: string | null;
    protected readonly limiter: Bottleneck;
    protected readonly expiration: number;
    protected readonly retryLimit: number;
    protected readonly url: string;

    constructor(options: HandlerAPIConstructorOptions) {
        const { auth, limiter, expiration, retryLimit, url } = options;
        this.secret = auth ? Buffer.from(`${auth.username}:${auth.apiKey}`).toString('base64') : null;
        this.userAgent = auth && auth.userAgent ? auth.userAgent : null;
        this.expiration = expiration || 2500;
        this.retryLimit = retryLimit || 3;
        this.limiter = limiter;
        this.url = url

        this.limiter.on('failed', async (error, jobInfo) => {
            if (jobInfo.retryCount >= this.retryLimit) return;
            const requestUpdates = jobInfo.args[0] as HandlerAPIRequestUpdates | undefined;
            const retryIn = 1000 * Math.pow(2, jobInfo.retryCount);
            if (requestUpdates && requestUpdates.onRetry) requestUpdates.onRetry(jobInfo.retryCount + 1, retryIn, error);
            return retryIn;
        });
        this.limiter.on('received', async (jobInfo) => {
            const requestUpdates = jobInfo.args[0] as HandlerAPIRequestUpdates | undefined;
            if (requestUpdates && requestUpdates.onReceived) requestUpdates.onReceived(jobInfo);
        });
        this.limiter.on('queued', async (jobInfo) => {
            const requestUpdates = jobInfo.args[0] as HandlerAPIRequestUpdates | undefined;
            if (requestUpdates && requestUpdates.onQueued) requestUpdates.onQueued(jobInfo);
        });
        this.limiter.on('scheduled', async (jobInfo) => {
            const requestUpdates = jobInfo.args[0] as HandlerAPIRequestUpdates | undefined;
            if (requestUpdates && requestUpdates.onScheduled) requestUpdates.onScheduled(jobInfo);
        });
        this.limiter.on('executing', async (jobInfo) => {
            const requestUpdates = jobInfo.args[0] as HandlerAPIRequestUpdates | undefined;
            if (requestUpdates && requestUpdates.onExecuting) requestUpdates.onExecuting(jobInfo);
        });
        this.limiter.on('done', async (jobInfo) => {
            const requestUpdates = jobInfo.args[0] as HandlerAPIRequestUpdates | undefined;
            if (requestUpdates && requestUpdates.onDone) requestUpdates.onDone(jobInfo);
        });

    }

    protected getRequestURL(endpoint: string, paramString: string) {
        return `${this.url}/${endpoint}?${paramString}`
    }

    protected getHeaders(): Headers {
        const headers = new Headers();
        if (this.secret) headers.set('Authorization', `Basic ${this.secret}`);
        if (this.userAgent) headers.set('User-Agent', this.userAgent);
        return headers;
    }

    protected async request(endpoint: string, params: [string, string | number][], requestUpdates?: HandlerAPIRequestUpdates): Promise<Response> {
        return this.limiter.schedule({ expiration: this.expiration }, async () => {
            const paramString = params.map((param) => `${param[0]}=${param[1]}`).join('&');
            const options = { method: 'GET', headers: this.getHeaders() };
            const url = this.getRequestURL(endpoint, paramString);
            return fetch(url, options);
        }, requestUpdates);
    }

    protected static createLimiter(options: { redis?: Redis, id: string, maxConcurrent: number, perSecond: number }) {
        const { redis, id, maxConcurrent, perSecond } = options;
        return new Bottleneck({
            id: id,
            maxConcurrent: maxConcurrent,
            minTime: 1000 / perSecond,
            reservoir: 5 * (perSecond),
            reservoirRefreshInterval: 5 * (1000),
            reservoirRefreshAmount: 5 * (perSecond),
            highWater: maxConcurrent,
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
}
