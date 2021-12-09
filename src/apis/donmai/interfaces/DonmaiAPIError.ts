export interface DonmaiAPIError {
    readonly success: boolean;
    readonly message: string;
    readonly backtrace: Array<string>;
}
