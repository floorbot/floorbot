export interface TraceMoeResult {
    readonly anilist: string | {
        readonly id: number;
        readonly idMal: number;
        readonly title: {
            readonly native: string;
            readonly romaji: string;
            readonly english: string;
        };
        readonly synonyms: string[];
        readonly isAdult: boolean;
    };
    readonly filename: string;
    readonly episode: number;
    readonly from: number;
    readonly to: number;
    readonly similarity: number;
    readonly video: string;
    readonly image: string;
}
