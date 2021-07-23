import { ApplicationCommandData, InteractionReplyOptions } from 'discord.js';
import { HandlerCustomData } from 'discord.js-commands';

export interface BooruCustomData extends HandlerCustomData {
    readonly m: 'p' | 'e',
    readonly t: string,
    readonly wl: string | null
}

export interface BooruHandlerOptions {
    readonly commandData: ApplicationCommandData
    readonly nsfw: boolean,
    readonly id: string,
}

export interface BooruHandlerReply extends InteractionReplyOptions {
    readonly imageURL?: string
}

export interface BooruImageData {
    tags: string | null,
    imageURL: string,
    postURL: string,
    score: number | null
}

export interface BooruSuggestionData {
    readonly suggestions: Array<{
        readonly name: string,
        readonly count: number
    }>,
    readonly tags: string,
    readonly url404: string | null
}
