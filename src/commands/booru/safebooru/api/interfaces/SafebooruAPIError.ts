export default interface SafebooruAPIError {
    readonly success: boolean,
    readonly message: string,
    readonly backtrace: Array<string>
}
