import { SelectMenuActionRowBuilder } from "../../lib/discord/builders/SelectMenuActionRowBuilder.js";
import { ButtonActionRowBuilder } from "../../lib/discord/builders/ButtonActionRowBuilder.js";
import { SelectMenuBuilder } from "../../lib/discord/builders/SelectMenuBuilder.js";
import { ButtonBuilder } from "../../lib/discord/builders/ButtonBuilder.js";
import { ReplyBuilder } from "../../lib/discord/builders/ReplyBuilder.js";
import { EmbedBuilder } from "../../lib/discord/builders/EmbedBuilder.js";
import { MixinConstructor } from "../../lib/ts-mixin-extended.js";
import { ButtonStyle, Util } from "discord.js";

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
export class BooruButtonActionRowBuilder extends BooruButtonActionRowMixin(ButtonActionRowBuilder) { };
export class BooruSelectMenuActionRowBuilder extends BooruSelectMenuActionRowMixin(SelectMenuActionRowBuilder) { };

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
            const actionRow = new BooruSelectMenuActionRowBuilder()
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
            const actionRow = new BooruButtonActionRowBuilder()
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
            const actionRow = new BooruButtonActionRowBuilder()
                .addViewOnlineButton(postData.imageURL)
                .addRepeatButton(tags)
                .addRecycleButton()
                .addImageButton();
            return this.addActionRow(actionRow);
        }
    };
}

export function BooruButtonActionRowMixin<T extends MixinConstructor<ButtonActionRowBuilder>>(Builder: T) {
    return class BooruActionRowBuilder extends Builder {

        public addRecycleButton(): this {
            const button = new ButtonBuilder()
                .setLabel('♻️')
                .setStyle(ButtonStyle.Success)
                .setCustomId(BooruComponentID.RECYCLE);
            return this.addComponents(button);
        }

        public addRepeatButton(tags?: string): this {
            const button = new ButtonBuilder()
                .setLabel(tags ? 'Search Again' : 'Random Again')
                .setStyle(ButtonStyle.Primary)
                .setCustomId(BooruComponentID.REPEAT);
            return this.addComponents(button);
        }

        public addTagsButton(): this {
            const button = new ButtonBuilder()
                .setLabel('Tags')
                .setStyle(ButtonStyle.Primary)
                .setCustomId(BooruComponentID.TAGS);
            return this.addComponents(button);
        }

        public addImageButton(): this {
            const button = new ButtonBuilder()
                .setLabel('Image')
                .setStyle(ButtonStyle.Primary)
                .setCustomId(BooruComponentID.IMAGE);
            return this.addComponents(button);
        }
    };
}


export function BooruSelectMenuActionRowMixin<T extends MixinConstructor<SelectMenuActionRowBuilder>>(Builder: T) {
    return class BooruActionRowBuilder extends Builder {

        public addSuggestionsSelectMenu(suggestions: BooruSuggestionData[]): this {
            const button = new SelectMenuBuilder()
                .setPlaceholder('See Suggested Tags')
                .setCustomId(BooruComponentID.SUGGESTIONS)
                .addOptions(...suggestions.map(suggestion => {
                    return {
                        label: Util.splitMessage(suggestion.name, { char: '', append: '...', maxLength: 25 })[0]!,
                        description: `${suggestion.count} posts for ${suggestion.name}`,
                        value: suggestion.name
                    };
                }));
            return this.addComponents(button);
        }
    };
}
