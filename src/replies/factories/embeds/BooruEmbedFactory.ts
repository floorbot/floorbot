import { BooruImageData, BooruSuggestionData } from "../interfaces/BooruInterfaces";
import { EmbedBuilder } from "../../builders/EmbedBuilder";
import { EmbedFactory } from "../EmbedFactory";
import { Context } from "../ReplyFactory";
import { Util } from "discord.js";

export interface BooruEmbedFactoryOptions {
    readonly apiName: string;
    readonly apiIcon: string;
}

export class BooruEmbedFactory extends EmbedFactory {

    public readonly apiName: string;
    public readonly apiIcon: string;

    constructor(context: Context, options: BooruEmbedFactoryOptions) {
        super(context);
        this.apiName = options.apiName;
        this.apiIcon = options.apiIcon;
    }

    public override createEmbedTemplate(): EmbedBuilder {
        return new EmbedBuilder()
            .setFooter(`Powered by ${this.apiName}`, this.apiIcon);
    }

    public createSuggestionEmbed(data: BooruSuggestionData): EmbedBuilder {
        const suggestionString = data.suggestions.map(tag => `${Util.escapeMarkdown(tag.name)} \`${tag.count} posts\``).join('\n');
        const embed = this.createEmbedTemplate()
            .setDescription([
                `No posts found for \`${data.tags}\``,
                ...(data.suggestions.length ? [
                    '',
                    `*Perhaps you meant one of the following:*\n${suggestionString}`,
                ] : [])
            ]);
        if (data.url404 && data.suggestions.length) embed.setThumbnail(data.url404);
        if (data.url404 && !data.suggestions.length) embed.setImage(data.url404);
        return embed;
    }

    public createImageEmbed(data: BooruImageData): EmbedBuilder {
        const escapedTags = data.tags ? Util.escapeMarkdown(data.tags).replace(/\+/g, ' ') : String();
        return this.createEmbedTemplate()
            .setImage(data.imageURL)
            .setDescription([
                (data.tags ? `**[${escapedTags}](${data.postURL})** ` : '') + `\`score: ${data.score ?? 0}\``,
                ...(/\.swf$/.test(data.imageURL) ? [`Sorry! This is a flash file 🙃\n*click the [link](${data.postURL}) to view in browser*`] : []),
                ...(/(\.webm)|(\.mp4)/.test(data.imageURL) ? [`Sorry! This is a \`webm\` or \`mp4\` file which is not supported in embeds... 😕\n*click the [link](${data.postURL}) to view in browser*`] : [])
            ]);
    }
}