export interface UrbanDictionaryAPIData {
    readonly definition: string;
    readonly permalink: string;
    readonly thumbs_up: number;
    readonly sound_urls: Array<string>;
    readonly author: string;
    readonly word: string;
    readonly defid: number;
    readonly current_vote: string;
    readonly written_on: string;
    readonly example: string;
    readonly thumbs_down: number;
}
