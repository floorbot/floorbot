export interface TraceMoeData {
    readonly frameCount: number,
    readonly error: string,
    readonly result: Array<{
        readonly anilist: {
            readonly id: number,
            readonly idMal: number,
            readonly title: {
                readonly native: string,
                readonly romaji: string,
                readonly english: string
            },
            readonly synonyms: Array<string>,
            readonly isAdult: boolean
        },
        readonly filename: string,
        readonly episode: number,
        readonly from: number,
        readonly to: number,
        readonly similarity: number,
        readonly video: string,
        readonly image: string
    }>
}
