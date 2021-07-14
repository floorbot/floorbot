export interface NodeCacheOptions {
    checkPeriod?: number
    maxKeys?: number,
    ttl?: number,
}

export interface CacheMapData<T> {
    epoch: number,
    ttl: number,
    value: T,
}

export default class CacheMap<K, T> {

    private timeoutID: NodeJS.Timeout | null = null;
    private readonly checkPeriod: number;
    private readonly maxKeys: number;
    private readonly ttl: number;
    private readonly cache: Map<K, CacheMapData<T>>;

    constructor(options: NodeCacheOptions) {
        this.checkPeriod = options.checkPeriod ?? 0;
        this.maxKeys = options.maxKeys ?? 0;
        this.ttl = options.ttl ?? 0;
        this.cache = new Map();
        if (this.checkPeriod) this._checkData();
    }

    public set(key: K, value: any, ttl?: number): boolean {
        this._checkAllKeys();
        if (this.maxKeys && this.cache.size >= this.maxKeys) return false;
        this.cache.set(key, {
            epoch: Date.now(),
            ttl: ttl ?? this.ttl,
            value: value
        })
        return true;
    }

    public get(key: K): T | undefined {
        const data = this._checkKey(key);
        return data ? data.value : undefined;
    }

    private _checkKey(key: K): CacheMapData<T> | undefined {
        const data = this.cache.get(key);
        if (!data) return undefined;
        if (data.ttl === 0) return data;
        const expiry = data.epoch + data.ttl;
        if (expiry > Date.now()) return data;
        this.cache.delete(key);
        return undefined;
    }

    private _checkAllKeys() {
        for (const key of this.cache.keys()) { this._checkKey(key); }
    }

    private _checkData() {
        this._checkAllKeys();
        if (!this.timeoutID) {
            this.timeoutID = setTimeout(() => {
                this.timeoutID = null;
                this._checkData();
            }, this.checkPeriod)
        }
    }
}
