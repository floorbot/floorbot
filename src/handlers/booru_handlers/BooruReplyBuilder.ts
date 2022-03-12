import { SelectMenuBuilder } from "../../lib/discord/builders/SelectMenuBuilder.js";
import { ActionRowBuilder } from "../../lib/discord/builders/ActionRowBuilder.js";
import { ButtonBuilder } from "../../lib/discord/builders/ButtonBuilder.js";
import { ReplyBuilder } from "../../lib/discord/builders/ReplyBuilder.js";
import { EmbedBuilder } from "../../lib/discord/builders/EmbedBuilder.js";
import { MixinConstructor } from "../../lib/ts-mixin-extended.js";
import { Constants, Util } from "discord.js";

const { MessageButtonStyles } = Constants;

export interface BooruSuggestionData {
    readonly name: string;
    readonly count: number;
}

export interface BooruPostData {
    readonly score: number | null;
    readonly imageURL: string;
    readonly postURL: string;
    readonly tags: string[];
}

export const BooruComponentID = {
    SUGGESTIONS: 'suggestions',
    RECYCLE: 'recycle',
    REPEAT: 'repeat',
    IMAGE: 'image',
    TAGS: 'tags',
};

export class BooruReplyBuilder extends BooruReplyMixin(ReplyBuilder) { };
export class BooruActionRowBuilder extends BooruActionRowMixin(ActionRowBuilder) { };

export function BooruReplyMixin<T extends MixinConstructor<ReplyBuilder>>(Builder: T) {
    return class BooruReplyBuilder extends Builder {

        protected createBooruEmbedBuilder(): EmbedBuilder {
            return super.createEmbedBuilder();
        }

        public addSuggestionEmbed(tags: string, suggestions: BooruSuggestionData[], url404?: string): this {
            const suggestionString = suggestions.map(tag => `${Util.escapeMarkdown(tag.name)} \`${tag.count} posts\``).join('\n');
            const embed = this.createBooruEmbedBuilder()
                .setDescription([
                    `No posts found for \`${tags}\``,
                    ...(suggestions.length ? [
                        '',
                        `*Perhaps you meant one of the following:*\n${suggestionString}`,
                    ] : [])
                ]);
            if (url404 && suggestions.length) embed.setThumbnail(url404);
            if (url404 && !suggestions.length) embed.setImage(url404);
            return this.addEmbed(embed);
        }

        public addSuggestionActionRow(suggestions: BooruSuggestionData[]): this {
            const actionRow = new BooruActionRowBuilder()
                .addSuggestionsSelectMenu(suggestions);
            return this.addActionRow(actionRow);
        }

        public addImageEmbed(postData: BooruPostData, tags?: string): this {
            const escapedTags = tags ? Util.escapeMarkdown(tags).replace(/\+/g, ' ') : String();
            const embed = this.createBooruEmbedBuilder()
                .setImage(postData.imageURL)
                .setDescription([
                    (tags ? `**[${escapedTags}](${postData.postURL})** ` : '') + `\`score: ${postData.score ?? 0}\``,
                    ...(/\.swf$/.test(postData.imageURL) ? [`Sorry! This is a flash file 🙃\n*click the [link](${postData.postURL}) to view in browser*`] : []),
                    ...(/(\.webm)|(\.mp4)/.test(postData.imageURL) ? [`Sorry! This is a \`webm\` or \`mp4\` file which is not supported in embeds... 😕\n*click the [link](${postData.postURL}) to view in browser*`] : [])
                ]);
            return this.addEmbed(embed);
        }

        public addImageActionRow(postData: BooruPostData, tags?: string): this {
            const actionRow = new BooruActionRowBuilder()
                .addViewOnlineButton(postData.imageURL)
                .addRepeatButton(tags)
                .addRecycleButton();
            if (postData.tags.length) actionRow.addTagsButton();
            return this.addActionRow(actionRow);
        }

        public addTagsEmbed(postData: BooruPostData, tags?: string): this {
            const escapedTags = tags ? Util.escapeMarkdown(tags).replace(/\+/g, ' ') : String();
            const tagsString = postData.tags.map(tag => `\`${tag}\``).join(' ');
            const embed = this.createBooruEmbedBuilder()
                .setThumbnail(postData.imageURL)
                .setDescription([
                    (tags ? `**[${escapedTags}](${postData.postURL})** ` : '') + `\`score: ${postData.score ?? 0}\``,
                    '',
                    Util.splitMessage(tagsString, { char: ' ', append: '...' })[0]!
                ]);
            return this.addEmbed(embed);
        }

        public addTagsActionRow(postData: BooruPostData, tags?: string): this {
            const actionRow = new BooruActionRowBuilder()
                .addViewOnlineButton(postData.imageURL)
                .addRepeatButton(tags)
                .addRecycleButton()
                .addImageButton();
            return this.addActionRow(actionRow);
        }
    };
}

export function BooruActionRowMixin<T extends MixinConstructor<ActionRowBuilder>>(Builder: T) {
    return class BooruActionRowBuilder extends Builder {

        public addSuggestionsSelectMenu(suggestions: BooruSuggestionData[]): this {
            const button = new SelectMenuBuilder()
                .setPlaceholder('See Suggested Tags')
                .setCustomId(BooruComponentID.SUGGESTIONS)
                .addOptions(suggestions.map(suggestion => {
                    return {
                        label: Util.splitMessage(suggestion.name, { char: '', append: '...', maxLength: 25 })[0]!,
                        description: `${suggestion.count} posts for ${suggestion.name}`,
                        value: suggestion.name
                    };
                }));
            return this.addComponents(button);
        }

        public addRecycleButton(): this {
            const button = new ButtonBuilder()
                .setLabel('♻️')
                .setStyle(MessageButtonStyles.SUCCESS)
                .setCustomId(BooruComponentID.RECYCLE);
            return this.addComponents(button);
        }

        public addRepeatButton(tags?: string): this {
            const button = new ButtonBuilder()
                .setLabel(tags ? 'Search Again' : 'Random Again')
                .setStyle(MessageButtonStyles.PRIMARY)
                .setCustomId(BooruComponentID.REPEAT);
            return this.addComponents(button);
        }

        public addTagsButton(): this {
            const button = new ButtonBuilder()
                .setLabel('Tags')
                .setStyle(MessageButtonStyles.PRIMARY)
                .setCustomId(BooruComponentID.TAGS);
            return this.addComponents(button);
        }

        public addImageButton(): this {
            const button = new ButtonBuilder()
                .setLabel('Image')
                .setStyle(MessageButtonStyles.PRIMARY)
                .setCustomId(BooruComponentID.IMAGE);
            return this.addComponents(button);
        }
    };
}
