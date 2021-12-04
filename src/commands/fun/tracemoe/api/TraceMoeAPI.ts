import fetch, { Headers } from 'node-fetch';
import Bottleneck from 'bottleneck';
import { Message } from 'discord.js';
import { TraceMoeData } from './interfaces/TraceMoeData.js'

export interface TraceMoeRateLimit {
    perMonth: number,
    perMinute: number,
    dailyOneCall: number
}

export interface TraceMoeAPIError {
    readonly cod: number,
    readonly message: string
}

export class TraceMoeAPI {

    private readonly minutelyLimit: Bottleneck;
    private readonly expiration: number;

//free tier is only 60 calls/minute and 1000 calls a month
    constructor(apiLimits: TraceMoeRateLimit = { perMonth: 1000, perMinute: 60, dailyOneCall: 1000 }) {
        this.expiration = 1000 * 60; // 60 second queue expiration

        // Creates a monthly (31 day) limit of specified requests (api limits)
        const monthlyLimit = new Bottleneck({
            id: `tracemoe-month`, maxConcurrent: 1, minTime: 0,
            reservoir: Math.floor(apiLimits.perMonth / 31),
            reservoirRefreshInterval: 1000 * 60 * 60 * 24 * 31,
            reservoirRefreshAmount: Math.floor(apiLimits.perMonth / 31)
        });

        // Creates a minutely (60 second) limit of specified requests (api limits)
        this.minutelyLimit = new Bottleneck({
            id: `tracemoe-minute`, maxConcurrent: 1, minTime: 0,
            reservoir: apiLimits.perMinute,
            reservoirRefreshInterval: 1000 * 60,
            reservoirRefreshAmount: apiLimits.perMinute
        });

        this.minutelyLimit.chain(monthlyLimit);
    }

    private async request(params: [string, string | number][], headers?: Headers): Promise<any> {
        const paramString = params.map((param) => `${param[0]}=${encodeURIComponent(param[1])}`).join('&');
        const url = `https://api.trace.moe/search?anilistInfo&${paramString}`;
        const options = { method: 'GET', headers: headers || new Headers()};
        return fetch(url, options).then((res: any) => res.json());
    }

    public async contextClick(message: Message): Promise<TraceMoeData | TraceMoeAPIError> {
        return this.minutelyLimit.schedule({ expiration: this.expiration }, async () => {
            const params: [string, string | number][] = [
                ['url', message.attachments.first()!.url],
            ];
            const req = await this.request(params);
            return req;
        });
    }

    public isError(data: any): data is TraceMoeAPIError {
        return ('cod' in data && data.cod >= 400);
    }
}
