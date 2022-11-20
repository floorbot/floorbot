export interface DonmaiAPIError {
    readonly success: boolean;
    readonly error: string;
    readonly message: string;
    readonly backtrace: Array<string>;
}
