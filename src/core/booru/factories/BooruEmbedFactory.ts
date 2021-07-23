import { EmbedFactory, HandlerContext, HandlerEmbed } from 'discord.js-commands';
import { BooruHandler, BooruImageData, BooruSuggestionData } from '../../../..'
import { Util } from 'discord.js';

export class BooruEmbedFactory extends EmbedFactory<BooruHandler> {

    constructor(handler: BooruHandler) {
        super(handler);
    }

    public getImageEmbed(context: HandlerContext, data: BooruImageData): HandlerEmbed {
        const escapedTags = data.tags ? Util.escapeMarkdown(data.tags).replace(/\+/g, ' ') : String();
        return this.getEmbedTemplate(context)
            .setImage(data.imageURL)
            .setDescription(
                (data.tags ? `**[${escapedTags}](${data.postURL})** ` : '') + `\`score: ${data.score ?? 0}\`` +
                (/\.swf$/.test(data.imageURL) ? `\n\nSorry! This is a flash file 🙃\n*click the [link](${data.postURL}) to view in browser*` : '')
            );
    }

    public getSuggestionEmbed(context: HandlerContext, data: BooruSuggestionData): HandlerEmbed {
        const suggestionString = data.suggestions.map(tag => `${Util.escapeMarkdown(tag.name)} \`${tag.count} posts\``).join('\n');
        const embed = this.getEmbedTemplate(context);
        if (data.url404 && data.suggestions.length) embed.setThumbnail(data.url404);
        if (data.url404 && !data.suggestions.length) embed.setImage(data.url404);
        embed.setDescription(`No posts found for \`${data.tags}\`` +
            (data.suggestions.length ? `\n\n*Perhaps you meant one of the following:*\n${suggestionString}` : '')
        );
        return embed;
    }

    public getRestrictedTagEmbed(context: HandlerContext, tag: string): HandlerEmbed {
        return this.getEmbedTemplate(context)
            .setDescription(`Sorry! The tag \`${tag}\` is censored and requires a Gold+ Account to view`);
    }

    public getTagLimitEmbed(context: HandlerContext, accountType: string, maxTags: string): HandlerEmbed {
        return this.getEmbedTemplate(context)
            .setDescription(`Sorry! You can only search up to \`${maxTags}\` tags with a \`${accountType}\` account 😦`);
    }

    public getTimeoutEmbed(context: HandlerContext, tags: string | null): HandlerEmbed {
        return this.getEmbedTemplate(context)
            .setDescription(`Sorry! The database timed out running the query \`${tags}\` 😭`);
    }

    public getWhitelistRecycleEmbed(context: HandlerContext): HandlerEmbed {
        return this.getEmbedTemplate(context)
            .setDescription(`Sorry! Only the original command owner can recycle this ${this.handler.id} 😭\n` + `*Please use \`/${this.handler.id}\` to make your own!*`);
    }

    public getWhitelistSuggestionEmbed(context: HandlerContext): HandlerEmbed {
        return this.getEmbedTemplate(context)
            .setDescription(`Sorry! Only the original command owner can select a suggestion 😭\n` + `*Please use \`/${this.handler.id}\` to make your own!*`);
    }
}
