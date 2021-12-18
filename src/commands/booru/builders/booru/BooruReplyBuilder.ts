import { BooruBuilderAPIData, BooruBuilderImageData, BooruBuilderSuggestionData } from "./BooruBuilderInterfaces.js";
import { BuilderContext } from "../../../../lib/discord/builders/BuilderInterfaces.js";
import { BooruSuggestionData } from "../../BooruReplies.js";
import { ReplyBuilder } from "../../../../lib/discord/builders/ReplyBuilder.js";
import { EmbedBuilder } from "../../../../lib/discord/builders/EmbedBuilder.js";
import { BooruActionRowBuilder } from "./BooruActionRowBuilder.js";
import { Util } from "discord.js";

export class BooruReplyBuilder extends ReplyBuilder {

    private readonly apiName: string;
    private readonly apiIcon: string;

    constructor(context: BuilderContext, apiData: BooruBuilderAPIData) {
        super(context);
        this.apiName = apiData.apiName;
        this.apiIcon = apiData.apiIcon;
    }

    protected override createEmbedBuilder(): EmbedBuilder {
        const embed = super.createEmbedBuilder();
        embed.setFooter(`Powered by ${this.apiName}`, this.apiIcon);
        return embed;
    }

    public addSuggestionEmbed(data: BooruBuilderSuggestionData): this {
        const suggestionString = data.suggestions.map(tag => `${Util.escapeMarkdown(tag.name)} \`${tag.count} posts\``).join('\n');
        const embed = this.createEmbedBuilder()
            .setDescription([
                `No posts found for \`${data.tags}\``,
                ...(data.suggestions.length ? [
                    '',
                    `*Perhaps you meant one of the following:*\n${suggestionString}`,
                ] : [])
            ]);
        if (data.url404 && data.suggestions.length) embed.setThumbnail(data.url404);
        if (data.url404 && !data.suggestions.length) embed.setImage(data.url404);
        return this.addEmbed(embed);
    }

    public addSuggestionActionRow(data: BooruSuggestionData): this {
        const actionRow = new BooruActionRowBuilder()
            .addSuggestionSelectMenu(data);
        return this.addActionRow(actionRow);
    }

    public addImageEmbed(data: BooruBuilderImageData): this {
        const escapedTags = data.tags ? Util.escapeMarkdown(data.tags).replace(/\+/g, ' ') : String();
        const embed = this.createEmbedBuilder()
            .setImage(data.imageURL)
            .setDescription([
                (data.tags ? `**[${escapedTags}](${data.postURL})** ` : '') + `\`score: ${data.score ?? 0}\``,
                ...(/\.swf$/.test(data.imageURL) ? [`Sorry! This is a flash file 🙃\n*click the [link](${data.postURL}) to view in browser*`] : []),
                ...(/(\.webm)|(\.mp4)/.test(data.imageURL) ? [`Sorry! This is a \`webm\` or \`mp4\` file which is not supported in embeds... 😕\n*click the [link](${data.postURL}) to view in browser*`] : [])
            ]);
        return this.addEmbed(embed);
    }

    public addImageActionRow(data: BooruBuilderImageData): this {
        const actionRow = new BooruActionRowBuilder()
            .addViewOnlineButton(data.imageURL)
            .addRepeatButton()
            .addRecycleButton();
        return this.addActionRow(actionRow);
    }
}
