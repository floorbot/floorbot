import { BooruBuilderAPIData, BooruBuilderImageData, BooruBuilderSuggestionData } from "./BooruBuilderInterfaces";
import { BooruSuggestionData } from "../../commands/booru/BooruReplies";
import { BooruActionRowBuilder } from "./BooruActionRowBuilder";
import { InteractionReplyOptions, Util } from "discord.js";
import { Context, ReplyBuilder } from "../ReplyBuilder";
import { BooruEmbedBuilder } from "./BooruEmbedBuilder";

export class BooruReplyBuilder extends ReplyBuilder {

    private readonly apiData: BooruBuilderAPIData;
    private readonly context: Context;

    constructor(context: Context, apiData: BooruBuilderAPIData, replyOptions?: InteractionReplyOptions) {
        super(replyOptions);
        this.apiData = apiData;
        this.context = context;
    }

    public addSuggestionEmbed(data: BooruBuilderSuggestionData): this {
        const suggestionString = data.suggestions.map(tag => `${Util.escapeMarkdown(tag.name)} \`${tag.count} posts\``).join('\n');
        const embed = new BooruEmbedBuilder(this.context, this.apiData)
            .setDescription([
                `No posts found for \`${data.tags}\``,
                ...(data.suggestions.length ? [
                    '',
                    `*Perhaps you meant one of the following:*\n${suggestionString}`,
                ] : [])
            ]);
        if (data.url404 && data.suggestions.length) embed.setThumbnail(data.url404);
        if (data.url404 && !data.suggestions.length) embed.setImage(data.url404);
        return this.addEmbeds(embed);
    }

    public addSuggestionActionRow(data: BooruSuggestionData): this {
        const actionRow = new BooruActionRowBuilder()
            .addSuggestionSelectMenu(data);
        return this.addActionRow(actionRow);
    }

    public addImageEmbed(data: BooruBuilderImageData): this {
        const escapedTags = data.tags ? Util.escapeMarkdown(data.tags).replace(/\+/g, ' ') : String();
        const embed = new BooruEmbedBuilder(this.context, this.apiData)
            .setImage(data.imageURL)
            .setDescription([
                (data.tags ? `**[${escapedTags}](${data.postURL})** ` : '') + `\`score: ${data.score ?? 0}\``,
                ...(/\.swf$/.test(data.imageURL) ? [`Sorry! This is a flash file 🙃\n*click the [link](${data.postURL}) to view in browser*`] : []),
                ...(/(\.webm)|(\.mp4)/.test(data.imageURL) ? [`Sorry! This is a \`webm\` or \`mp4\` file which is not supported in embeds... 😕\n*click the [link](${data.postURL}) to view in browser*`] : [])
            ]);
        return this.addEmbeds(embed);
    }

    public addImageActionRow(data: BooruBuilderImageData): this {
        const actionRow = new BooruActionRowBuilder()
            .addViewOnlineButton(data.imageURL)
            .addRepeatButton()
            .addRecycleButton();
        return this.addActionRow(actionRow);
    }
}