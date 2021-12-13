export interface TraceMoeMeResponse {
    readonly id: string,
    readonly priority: number,
    readonly concurrency: number,
    readonly quota: number,
    readonly quotaUsed: number,
}
