import { Interaction, MessageEmbed, MessageEmbedOptions, Util } from 'discord.js';
import { HandlerEmbed } from '../../discord/components/HandlerEmbed.js';
import { BooruHandler, BooruSuggestionData } from './BooruHandler.js';

export interface BooruImageData {
    tags: string | null,
    imageURL: string,
    postURL: string,
    score: number | null
}

export class BooruEmbed extends HandlerEmbed {

    constructor(handler: BooruHandler, interaction: Interaction, data?: MessageEmbed | MessageEmbedOptions) {
        super(data);
        this.setContextAuthor(interaction);
        this.setFooter(`Powered by ${handler.apiName}`, handler.apiIcon);
    }

    public static createImageEmbed(handler: BooruHandler, interaction: Interaction, data: BooruImageData): BooruEmbed {
        const escapedTags = data.tags ? Util.escapeMarkdown(data.tags).replace(/\+/g, ' ') : String();
        return new BooruEmbed(handler, interaction)
            .setImage(data.imageURL)
            .setDescription(
                (data.tags ? `**[${escapedTags}](${data.postURL})** ` : '') + `\`score: ${data.score ?? 0}\`` +
                (/\.swf$/.test(data.imageURL) ? `\n\nSorry! This is a flash file 🙃\n*click the [link](${data.postURL}) to view in browser*` : '') +
                (/(\.webm)|(\.mp4)/.test(data.imageURL) ? `\n\nSorry! This is a \`webm\` or \`mp4\` file which is not supported in embeds... 😕\n*click the [link](${data.postURL}) to view in browser*` : '')
            );
    }

    public static createSuggestionEmbed(handler: BooruHandler, interaction: Interaction, data: BooruSuggestionData): BooruEmbed {
        const suggestionString = data.suggestions.map(tag => `${Util.escapeMarkdown(tag.name)} \`${tag.count} posts\``).join('\n');
        const embed = new BooruEmbed(handler, interaction);
        if (data.url404 && data.suggestions.length) embed.setThumbnail(data.url404);
        if (data.url404 && !data.suggestions.length) embed.setImage(data.url404);
        embed.setDescription(`No posts found for \`${data.tags}\`` +
            (data.suggestions.length ? `\n\n*Perhaps you meant one of the following:*\n${suggestionString}` : '')
        );
        return embed;
    }

    public static createRestrictedTagEmbed(handler: BooruHandler, interaction: Interaction, tag: string): BooruEmbed {
        return new BooruEmbed(handler, interaction)
            .setDescription(`Sorry! The tag \`${tag}\` is censored and requires a Gold+ account to view`);
    }

    public static createTagLimitEmbed(handler: BooruHandler, interaction: Interaction, accountType: string, maxTags: string): BooruEmbed {
        return new BooruEmbed(handler, interaction)
            .setDescription(`Sorry! You can only search up to \`${maxTags}\` tags with a \`${accountType}\` account 😦`);
    }

    public static createTimeoutEmbed(handler: BooruHandler, interaction: Interaction, tags: string | null): BooruEmbed {
        return new BooruEmbed(handler, interaction)
            .setDescription(`Sorry! The database timed out running the query \`${tags}\` 😭`);
    }
}
