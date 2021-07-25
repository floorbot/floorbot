import { BooruHandler, BooruImageData, BooruSuggestionData } from '../../../..'
import { HandlerContext, HandlerEmbed } from 'discord.js-commands';
import { Util } from 'discord.js';

export class BooruEmbedFactory {

    public static getImageEmbed(handler: BooruHandler, context: HandlerContext, data: BooruImageData): HandlerEmbed {
        const escapedTags = data.tags ? Util.escapeMarkdown(data.tags).replace(/\+/g, ' ') : String();
        return handler.getEmbedTemplate(context)
            .setImage(data.imageURL)
            .setDescription(
                (data.tags ? `**[${escapedTags}](${data.postURL})** ` : '') + `\`score: ${data.score ?? 0}\`` +
                (/\.swf$/.test(data.imageURL) ? `\n\nSorry! This is a flash file 🙃\n*click the [link](${data.postURL}) to view in browser*` : '')
            );
    }

    public static getSuggestionEmbed(handler: BooruHandler, context: HandlerContext, data: BooruSuggestionData): HandlerEmbed {
        const suggestionString = data.suggestions.map(tag => `${Util.escapeMarkdown(tag.name)} \`${tag.count} posts\``).join('\n');
        const embed = handler.getEmbedTemplate(context);
        if (data.url404 && data.suggestions.length) embed.setThumbnail(data.url404);
        if (data.url404 && !data.suggestions.length) embed.setImage(data.url404);
        embed.setDescription(`No posts found for \`${data.tags}\`` +
            (data.suggestions.length ? `\n\n*Perhaps you meant one of the following:*\n${suggestionString}` : '')
        );
        return embed;
    }

    public static getRestrictedTagEmbed(handler: BooruHandler, context: HandlerContext, tag: string): HandlerEmbed {
        return handler.getEmbedTemplate(context)
            .setDescription(`Sorry! The tag \`${tag}\` is censored and requires a Gold+ Account to view`);
    }

    public static getTagLimitEmbed(handler: BooruHandler, context: HandlerContext, accountType: string, maxTags: string): HandlerEmbed {
        return handler.getEmbedTemplate(context)
            .setDescription(`Sorry! You can only search up to \`${maxTags}\` tags with a \`${accountType}\` account 😦`);
    }

    public static getTimeoutEmbed(handler: BooruHandler, context: HandlerContext, tags: string | null): HandlerEmbed {
        return handler.getEmbedTemplate(context)
            .setDescription(`Sorry! The database timed out running the query \`${tags}\` 😭`);
    }
}
