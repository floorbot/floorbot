export default interface DanbooruAPIError {
    readonly success: boolean,
    readonly message: string,
    readonly backtrace: Array<string>
}
