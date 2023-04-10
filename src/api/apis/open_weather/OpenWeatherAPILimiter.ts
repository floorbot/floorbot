import Bottleneck from 'bottleneck';
import { Redis } from 'ioredis';
import { APIBottleneckLimiter } from '../../../api/limiters/BottleneckAPILimiter.js';
import { OpenWeatherRequestOptions } from './OpenWeatherAPI.js';

export class OpenWeatherAPILimiter extends APIBottleneckLimiter<OpenWeatherRequestOptions> {

    constructor(apiKey: string, { perMonth = 1000000, perMinute = 60, dailyOneCall = 1000 }, redis?: Redis) {

        console.log('openweather limiter maxConcurrent and comments');
        console.log('tbh  idk if the cache is even being deleted? which means idk if it is even working...');

        // Creates a monthly (31 day) limit of specified requests (api limits)
        const monthlyLimit = new Bottleneck({
            id: `openweather-month-${apiKey}`, maxConcurrent: 5, minTime: 0,
            reservoir: Math.floor(perMonth / 31),
            reservoirRefreshInterval: 1000 * 60 * 60 * 24 * 31 / 31,
            reservoirRefreshAmount: Math.floor(perMonth / 31),
            // highWater: 10, // Same as maxConcurrent
            // strategy: Bottleneck.strategy.OVERFLOW,
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
            id: `openweather-minute-${apiKey}`, maxConcurrent: 5, minTime: 0,
            reservoir: perMinute,
            reservoirRefreshInterval: 1000 * 60,
            reservoirRefreshAmount: perMinute,
            // highWater: 10, // Same as maxConcurrent
            // strategy: Bottleneck.strategy.OVERFLOW,
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
            id: `openweather-daily-${apiKey}`, maxConcurrent: 5, minTime: 0,
            reservoir: dailyOneCall,
            reservoirRefreshInterval: 1000 * 60 * 60 * 24,
            reservoirRefreshAmount: dailyOneCall,
            // highWater: 10, // Same as maxConcurrent
            // strategy: Bottleneck.strategy.OVERFLOW,
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
                'data/2.5/air_pollution': minutelyLimit,
                'data/2.5/onecall': onecallLimit,
                'geo/1.0/direct': minutelyLimit
            }
        });
    }
}
