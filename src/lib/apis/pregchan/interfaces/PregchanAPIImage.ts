import { PregchanAPIThread } from "./PregchanAPIThread.js";

export interface PregchanAPIImage {
    readonly imageURL: string,
    readonly count: number,
    readonly thread: PregchanAPIThread;
}
