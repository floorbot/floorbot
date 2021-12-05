import { TraceMoeData } from './interfaces/TraceMoeData.js'
import fetch, { Headers } from 'node-fetch';
import Bottleneck from 'bottleneck';

export interface TraceMoeRateLimit {
    perMonth: number,
    perMinute: number
}

export class TraceMoeAPI {

    private readonly limiter: Bottleneck;

    //free tier is only 60 calls/minute and 1000 calls a month
    constructor(apiLimits: TraceMoeRateLimit = { perMonth: 1000, perMinute: 60 }) {

        // Creates a monthly (31 day) limit of specified requests (api limits)
        const monthlyLimit = new Bottleneck({
            id: `tracemoe-month`, maxConcurrent: 10, minTime: 0,
            reservoir: Math.floor(apiLimits.perMonth / 31),
            reservoirRefreshInterval: 1000 * 60 * 60 * 24 * 31,
            reservoirRefreshAmount: Math.floor(apiLimits.perMonth / 31)
        });

        // Creates a minutely (60 second) limit of specified requests (api limits)
        this.limiter = new Bottleneck({
            id: `tracemoe-minute`, maxConcurrent: 10, minTime: 0,
            reservoir: apiLimits.perMinute,
            reservoirRefreshInterval: 1000 * 60,
            reservoirRefreshAmount: apiLimits.perMinute
        });

        this.limiter.chain(monthlyLimit);
    }

    private async request(params: [string, string | number][], headers?: Headers): Promise<any> {
        const paramString = params.map((param) => `${param[0]}=${encodeURIComponent(param[1])}`).join('&');
        const url = `https://api.trace.moe/search?anilistInfo&${paramString}`;
        const options = { method: 'GET', headers: headers || new Headers() };
        return fetch(url, options).then((res: any) => res.json());
    }

    public async fetchTraceMoeData(url: string): Promise<TraceMoeData> {
        return this.limiter.schedule({ expiration: 1000 * 60 }, () => {
            const params: [string, string | number][] = [['url', url]];
            return this.request(params);
        });
    }
}
