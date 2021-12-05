import { TraceMoeData } from './interfaces/TraceMoeData.js'
import fetch, { Headers } from 'node-fetch';
import Bottleneck from 'bottleneck';
import NodeCache from 'node-cache';

export interface TraceMoeRateLimit {
    perMonth: number,
    perMinute: number
}

export class TraceMoeAPI {

    private readonly limiter: Bottleneck;
    private static DEFINE_CACHE = new NodeCache({ stdTTL: 60 * 60 });

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

    private async request(params: [string, string | number][], headers?: Headers): Promise<TraceMoeData[]> {
        const paramString = params.map((param) => `${param[0]}=${encodeURIComponent(param[1])}`).join('&');
        const url = `https://api.trace.moe/search?anilistInfo&${paramString}`;
        const options = { method: 'GET', headers: headers || new Headers() };
        return fetch(url, options).then((res: any) => res.json()).then((json) => json.result);
    }

    public async fetchTraceMoeData(url: string): Promise<TraceMoeData[]> {
        const cacheKey = url.toLowerCase();
        const existing = TraceMoeAPI.DEFINE_CACHE.get(cacheKey);
        if (existing) return existing as TraceMoeData[];
        return this.limiter.schedule({ expiration: 1000 * 60 }, () => {
            const params: [string, string | number][] = [['url', url]];
            return this.request(params)
              .then(res => { return res ?? []})
              .then(res => {
                  if (cacheKey) TraceMoeAPI.DEFINE_CACHE.set(cacheKey, res);
                  return res;
              });
        });
    }
}
