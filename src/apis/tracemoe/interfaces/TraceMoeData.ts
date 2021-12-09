import { TraceMoeResult } from "./TraceMoeResult";

export interface TraceMoeResponse {
    frameCount: number;
    error: string;
    result: TraceMoeResult[];
}