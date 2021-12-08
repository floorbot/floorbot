export interface BooruBuilderSuggestionData {
    readonly suggestions: { readonly name: string; readonly count: number; }[];
    readonly url404: string | null;
    readonly tags: string;
}

export interface BooruBuilderImageData {
    readonly score: number | null;
    readonly tags: string | null;
    readonly imageURL: string;
    readonly postURL: string;
}

export interface BooruBuilderAPIData {
    readonly apiName: string;
    readonly apiIcon: string;
}