import { BooruSelectMenuActionRowBuilder, BooruSuggestionData } from './BooruSelectMenuActionRowBuilder.js';
import { BooruButtonActionRowBuilder } from './BooruButtonActionRowBuilder.js';
import { ReplyBuilder } from "../../../lib/discord/builders/ReplyBuilder.js";
import { EmbedBuilder } from "../../../lib/discord/builders/EmbedBuilder.js";
import { DiscordUtil } from '../../../lib/discord/DiscordUtil.js';
import { Util } from "discord.js";

export interface BaseBooruData {
    readonly query: string | null;
    readonly apiName: string;
    readonly apiIconURL: string;
}

export interface BooruErrorData extends BaseBooruData {
    readonly error: string | null;
}

export interface BooruPostData extends BaseBooruData {
    readonly score: number | null;
    readonly count: number | null;
    readonly imageURL: string;
    readonly postURL: string;
    readonly tags_characters: string[];
    readonly tags_species: string[];
    readonly tags_general: string[];
}

export class BooruReplyBuilder extends ReplyBuilder {

    protected getPostDetails(booru: BooruPostData): string {
        const escapedQuery = booru.query ? Util.escapeMarkdown(booru.query).replace(/\+/g, ' ') : '';
        const queryString = booru.query ? `**[${escapedQuery}](${booru.postURL})** ` : '';
        const scoreString = booru.score ? DiscordUtil.formatCommas(booru.score) : 'unknown';
        const countString = booru.count ? DiscordUtil.formatCommas(booru.count) : 'unknown';
        return queryString + `\`score: ${scoreString}\` \`count: ${countString}\``;
    }

    protected createBooruEmbedBuilder(booru: BaseBooruData): EmbedBuilder {
        return super.createEmbedBuilder()
            .setFooter({ text: `Powered by ${booru.apiName}`, iconURL: booru.apiIconURL });
    }

    public addBooruErrorEmbed(booru: BooruErrorData): this {
        const embed = this.createEmbedBuilder()
            .setDescription(booru.error);
        return this.addEmbed(embed);
    }

    public addBooruSavedEmbed(booru: BooruPostData): this {
        const embed = this.createBooruEmbedBuilder(booru)
            .setThumbnail(booru.imageURL)
            .setTitle('Booru Saved!')
            .setURL(booru.postURL)
            .setDescription([
                'Successfully saved this booru to your favourites!',
                '*You can see your saved boorus with `/saved boorus`*'
            ]);
        return this.addEmbed(embed);
    }

    public addSuggestionsEmbed(booru: BooruSuggestionData): this {
        const suggestionString = booru.suggestions.map(tag => `${Util.escapeMarkdown(tag.name)} \`${tag.count} posts\``).join('\n');
        const embed = this.createBooruEmbedBuilder(booru)
            .setDescription([
                `No posts found for \`${booru.query}\``,
                ...(booru.suggestions.length ? [
                    '',
                    `*Perhaps you meant one of the following:*\n${suggestionString}`,
                ] : [])
            ]);
        if (booru.url404 && booru.suggestions.length) embed.setThumbnail(booru.url404);
        if (booru.url404 && !booru.suggestions.length) embed.setImage(booru.url404);
        return this.addEmbed(embed);
    }

    public addImageEmbed(booru: BooruPostData): this {
        const embed = this.createBooruEmbedBuilder(booru)
            .setImage(booru.imageURL)
            .setDescription([
                this.getPostDetails(booru),
                '',
                ...(/\.swf$/.test(booru.imageURL) ? [`Sorry! This is a flash file 🙃\n*click the [link](${booru.postURL}) to view in browser*`] : []),
                ...(/(\.webm$)|(\.mp4$)/.test(booru.imageURL) ? [`Sorry! This is a \`webm\` or \`mp4\` file which is not supported in embeds... 😕\n*click the [link](${booru.postURL}) to view in browser*`] : [])
            ]);
        return this.addEmbed(embed);
    }

    public addTagsEmbed(booru: BooruPostData): this {
        const characterTagsString = booru.tags_characters.map(tag => `\`${tag}\``).join(' ');
        const speciesTagsString = booru.tags_species.map(tag => `\`${tag}\``).join(' ');
        const generalTagsString = booru.tags_general.map(tag => `\`${tag}\``).join(' ');
        const embed = this.createBooruEmbedBuilder(booru)
            .setThumbnail(booru.imageURL)
            .setDescription([
                this.getPostDetails(booru),
                '',
                ...(booru.tags_characters.length ? [`**Characters**: ${DiscordUtil.shortenMessage(characterTagsString, { char: ' ', append: '...', maxLength: 512 })}`] : []),
                ...(booru.tags_species.length ? [`**Species**: ${DiscordUtil.shortenMessage(speciesTagsString, { char: ' ', append: '...', maxLength: 512 })}`] : []),
                ...(booru.tags_general.length ? [`**Tags**: ${DiscordUtil.shortenMessage(generalTagsString, { char: ' ', append: '...', maxLength: 1024 })}`] : [])
            ]);
        return this.addEmbed(embed);
    }

    public addSuggestionsActionRow(booru: BooruSuggestionData): this {
        const actionRow = new BooruSelectMenuActionRowBuilder()
            .addSuggestionsSelectMenu(booru);
        return this.addActionRow(actionRow);
    }

    public addImageActionRow(booru: BooruPostData): this {
        const allTags = [...booru.tags_characters, ...booru.tags_species, ...booru.tags_general];
        const actionRow = new BooruButtonActionRowBuilder()
            .addViewOnlineButton(booru.postURL)
            .addTagsButton({ disabled: !allTags.length })
            .addRepeatButton(booru.query)
            .addRecycleButton()
            .addHeartButton();
        return this.addActionRow(actionRow);
    }

    public addTagsActionRow(booru: BooruPostData): this {
        const actionRow = new BooruButtonActionRowBuilder()
            .addViewOnlineButton(booru.postURL)
            .addImageButton()
            .addRepeatButton(booru.query)
            .addRecycleButton()
            .addHeartButton();
        return this.addActionRow(actionRow);
    }
}
