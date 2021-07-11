import { MessageEmbed, Util } from 'discord.js';
import { BooruEmbed } from '../BooruEmbed';

export interface SuggestionEmbedData {
    readonly suggestions: Array<{
        readonly name: string,
        readonly count: number
    }>,
    readonly tags: string,
    readonly url404: string | null
}

export class SuggestionEmbed extends BooruEmbed {

    constructor(embed: MessageEmbed, data: SuggestionEmbedData) {
        super(embed);

        const suggestionString = data.suggestions.map(tag => `${Util.escapeMarkdown(tag.name)} \`${tag.count} posts\``).join('\n');
        if (data.url404 && data.suggestions.length) this.setThumbnail(data.url404);
        if (data.url404 && !data.suggestions.length) this.setImage(data.url404);
        this.setDescription(`No posts found for \`${data.tags}\`` +
            (data.suggestions.length ? `\n\n*Perhaps you meant one of the following:*\n${suggestionString}` : '')
        );
    }
}
