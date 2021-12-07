export interface BooruSuggestionData {
    readonly suggestions: { readonly name: string, readonly count: number; }[];
    readonly url404: string | null;
    readonly tags: string;
}

export interface BooruImageData {
    readonly score: number | null;
    readonly tags: string | null;
    readonly imageURL: string;
    readonly postURL: string;
}