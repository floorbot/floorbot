import { ActionRowBuilder, ComponentID } from "../../lib/discord/builders/ActionRowBuilder.js";
import { SelectMenuBuilder } from "../../lib/discord/builders/SelectMenuBuilder.js";
import { BuilderContext } from "../../lib/discord/builders/BuilderInterfaces.js";
import { ButtonBuilder } from "../../lib/discord/builders/ButtonBuilder.js";
import { ReplyBuilder } from "../../lib/discord/builders/ReplyBuilder.js";
import { EmbedBuilder } from "../../lib/discord/builders/EmbedBuilder.js";
import { Constants, Util } from "discord.js";

const { MessageButtonStyles } = Constants;

export const BooruComponentID = {
    ...ComponentID, ...{
        SUGGESTIONS: 'suggestions',
        RECYCLE: 'recycle',
        REPEAT: 'repeat'
    }
};

export interface BooruSuggestionData {
    readonly suggestions: { readonly name: string; readonly count: number; }[];
    readonly url404: string | null;
    readonly tags: string;
}

export interface BooruImageData {
    readonly score: number | null;
    readonly tags: string | null;
    readonly imageURL: string;
    readonly postURL: string;
}

export interface BooruAPIData {
    readonly apiName: string;
    readonly apiIcon: string;
}

export class BooruReplyBuilder extends ReplyBuilder {

    private readonly apiName: string;
    private readonly apiIcon: string;

    constructor(context: BuilderContext, apiData: BooruAPIData) {
        super(context);
        this.apiName = apiData.apiName;
        this.apiIcon = apiData.apiIcon;
    }

    protected override createEmbedBuilder(): EmbedBuilder {
        const embed = super.createEmbedBuilder();
        embed.setFooter(`Powered by ${this.apiName}`, this.apiIcon);
        return embed;
    }

    public addSuggestionEmbed(data: BooruSuggestionData): this {
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
        const actionRow = new ActionRowBuilder();
        const selectMenu = new SelectMenuBuilder()
            .setPlaceholder('See Suggested Tags')
            .setCustomId(BooruComponentID.SUGGESTIONS)
            .addOptions(data.suggestions.map(suggestion => {
                return {
                    label: Util.splitMessage(suggestion.name, { char: '', append: '...', maxLength: 25 })[0]!,
                    description: `${suggestion.count} posts for ${suggestion.name}`,
                    value: suggestion.name
                };
            }));
        actionRow.addComponents(selectMenu);
        return this.addActionRow(actionRow);
    }

    public addImageEmbed(data: BooruImageData): this {
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

    public addImageActionRow(data: BooruImageData, tags?: string): this {
        const actionRow = new ActionRowBuilder()
            .addViewOnlineButton(data.imageURL);
        const repeatButton = new ButtonBuilder()
            .setLabel(tags ? 'Search Again' : 'Random Again')
            .setStyle(MessageButtonStyles.PRIMARY)
            .setCustomId(BooruComponentID.REPEAT);
        const recycleButton = new ButtonBuilder()
            .setLabel('♻️')
            .setStyle(MessageButtonStyles.SUCCESS)
            .setCustomId(BooruComponentID.RECYCLE);
        actionRow.addComponents(repeatButton);
        actionRow.addComponents(recycleButton);
        return this.addActionRow(actionRow);
    }
}
