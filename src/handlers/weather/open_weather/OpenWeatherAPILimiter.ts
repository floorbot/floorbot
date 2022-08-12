import { APIBottleneckLimiter } from '../../../lib/api/limiters/BottleneckAPILimiter.js';
import { OpenWeatherRequestOptions } from './OpenWeatherAPI.js';
import Bottleneck from 'bottleneck';
import { Redis } from 'ioredis';

export class OpenWeatherAPILimiter extends APIBottleneckLimiter<OpenWeatherRequestOptions> {

    constructor(apiKey: string, { perMonth = 1000000, perMinute = 60, dailyOneCall = 1000 }, redis?: Redis) {

        // Creates a monthly (31 day) limit of specified requests (api limits)
        const monthlyLimit = new Bottleneck({
            id: `openweather-month-${apiKey}`, maxConcurrent: 1, minTime: 0,
            reservoir: Math.floor(perMonth / 31),
            reservoirRefreshInterval: 1000 * 60 * 60 * 24 * 31,
            reservoirRefreshAmount: Math.floor(perMonth / 31),
            highWater: 10, // Same as maxConcurrent
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

        // Creates a minutely (60 second) limit of specified requests (api limits)
        const minutelyLimit = new Bottleneck({
            id: `openweather-minute-${apiKey}`, maxConcurrent: 1, minTime: 0,
            reservoir: perMinute,
            reservoirRefreshInterval: 1000 * 60,
            reservoirRefreshAmount: perMinute,
            highWater: 10, // Same as maxConcurrent
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

        // Creates a daily (24 hour) limit of specified one call requests (api limits)
        const onecallLimit = new Bottleneck({
            id: `openweather-minute-${apiKey}`, maxConcurrent: 1, minTime: 0,
            reservoir: dailyOneCall,
            reservoirRefreshInterval: 1000 * 60 * 60 * 24,
            reservoirRefreshAmount: dailyOneCall,
            highWater: 10, // Same as maxConcurrent
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

        minutelyLimit.chain(monthlyLimit);
        onecallLimit.chain(minutelyLimit);

        super({
            limits: {
                'ata/2.5/air_pollution': minutelyLimit,
                'data/2.5/onecall': onecallLimit,
                'geo/1.0/direct': minutelyLimit
            }
        });
    }
}
