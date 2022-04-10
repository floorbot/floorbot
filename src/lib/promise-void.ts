/**
 * Wraps a promise to return void
 * @param promise The promise to void
 * @returns The voided promise
 */
export default function pVoid(promise: Promise<any>): Promise<void> {
    return promise.then(() => undefined);
}
