import { ActionRowBuilder, chatInputApplicationCommandMention, ChatInputCommandInteraction, escapeMarkdown, MessageActionRowComponentBuilder } from 'discord.js';
import { AttachmentFactory, AvatarExpression } from '../../../floorbot/helpers/AttachmentFactory.js';
import { ReplyBuilder } from '../../../discord/builders/ReplyBuilder.js';
import { Util } from '../../../floorbot/helpers/Util.js';

export interface BooruPostData {
    readonly score: number | null;
    readonly count: number | null;
    readonly imageURL: string;
    readonly postURL: string;
    readonly tags_characters: string[];
    readonly tags_species: string[];
    readonly tags_general: string[];
}

export class BooruReplyBuilder extends ReplyBuilder {

    protected static getPostDetails(tags: string | null, post: BooruPostData): string {
        const escapedQuery = tags ? escapeMarkdown(tags).replace(/\+/g, ' ') : '';
        const queryString = tags ? `**[${escapedQuery}](${post.postURL})** ` : '';
        const scoreString = post.score !== null ? Util.formatCommas(post.score) : 'unknown';
        const countString = post.count !== null ? Util.formatCommas(post.count) : 'unknown';
        return queryString + `\`score: ${scoreString}\` \`count: ${countString}\``;
    }

    public override addImageEmbed({ tags, post }: { tags: string | null, post: BooruPostData; }): this {
        const embed = this.createEmbedBuilder()
            .setImage(post.imageURL)
            .setDescription([
                BooruReplyBuilder.getPostDetails(tags, post),
                '',
                ...(/\.swf$/.test(post.imageURL) ? [`Sorry! This is a flash file 🙃`, `*click the [link](${post.postURL}) to view in browser*`] : []),
                ...(/(\.webm$)|(\.mp4$)/.test(post.imageURL) ? [`Sorry! This is a \`webm\` or \`mp4\` file which is not supported in embeds... 😕`, `*click the [link](${post.postURL}) to view in browser*`] : [])
            ].join('\n'));
        return this.addEmbeds(embed);
    }

    public override addTagsEmbed({ tags, post }: { tags: string | null, post: BooruPostData; }): this {
        const characterTagsString = post.tags_characters.map(tag => `\`${tag}\``).join(' ');
        const speciesTagsString = post.tags_species.map(tag => `\`${tag}\``).join(' ');
        const generalTagsString = post.tags_general.map(tag => `\`${tag}\``).join(' ');
        const embed = this.createEmbedBuilder()
            .setThumbnail(post.imageURL)
            .setDescription([
                BooruReplyBuilder.getPostDetails(tags, post),
                '',
                ...(post.tags_characters.length ? [`**Characters**: ${Util.shortenText(characterTagsString, { char: ' ', append: '...', maxLength: 512 })}`] : []),
                ...(post.tags_species.length ? [`**Species**: ${Util.shortenText(speciesTagsString, { char: ' ', append: '...', maxLength: 512 })}`] : []),
                ...(post.tags_general.length ? [`**Tags**: ${Util.shortenText(generalTagsString, { char: ' ', append: '...', maxLength: 1024 })}`] : [])
            ].join('\n'));
        return this.addEmbeds(embed);
    }

    public override addSuggestionsEmbed({ tags, suggestions, message, command }: { tags: string, suggestions: { name: string; count: number; }[], message?: string, command: ChatInputCommandInteraction; }): this {
        const attachment = AttachmentFactory.avatarExpression({ expression: AvatarExpression.Sad });
        const suggestionString = suggestions.slice(0, 5).map(tag => `${tag.name} \`${Util.formatCommas(tag.count)} posts\``).join('\n');
        const commandMention = chatInputApplicationCommandMention(command.commandName, command.commandId);
        const embed = this.createEmbedBuilder({ suffix: 'Not Found' })
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription([
                `Sorry! I could not find any ${commandMention} posts for \`${tags}\``,
                ...(suggestions.length ? [
                    '',
                    '*Perhaps you meant one of the following:*',
                    `${suggestionString}`
                ] : [
                    message ? `*${message}*` : '*Please check your spelling or try again later!*'
                ])
            ].join('\n'));
        this.addEmbeds(embed);
        this.addFiles(attachment);
        return this;
    }

    public override  addImageActionRow(booru: BooruPostData): this {
        const allTags = [...booru.tags_characters, ...booru.tags_species, ...booru.tags_general];
        const actionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>()
            .addViewOnlineButton(booru.postURL)
            .addTagsButton({ disabled: !allTags.length })
            .addRecycleButton();
        return this.addComponents(actionRow);
    }

    public override addTagsActionRow(booru: BooruPostData): this {
        const actionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>()
            .addViewOnlineButton(booru.postURL)
            .addImageButton()
            .addRecycleButton();
        return this.addComponents(actionRow);
    }

    public override addSuggestionsActionRow({ suggestions }: { suggestions: { name: string; count: number; }[]; }): this {
        const actionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>()
            .addSuggestionsSelectMenu(suggestions);
        return this.addComponents(actionRow);
    }
}

declare module '../../../discord/builders/ReplyBuilder' {
    export interface ReplyBuilder {
        addImageEmbed({ tags, post }: { tags: string | null, post: BooruPostData; }): this;
        addTagsEmbed({ tags, post }: { tags: string | null, post: BooruPostData; }): this;
        addSuggestionsEmbed({ tags, suggestions, message, command }: { tags: string, suggestions: { name: string; count: number; }[], message?: string, command: ChatInputCommandInteraction; }): this;
        addImageActionRow(booru: BooruPostData): this;
        addTagsActionRow(booru: BooruPostData): this;
        addSuggestionsActionRow({ suggestions }: { suggestions: { name: string; count: number; }[]; }): this;
    }
};

ReplyBuilder.prototype.addImageEmbed = BooruReplyBuilder.prototype.addImageEmbed;
ReplyBuilder.prototype.addTagsEmbed = BooruReplyBuilder.prototype.addTagsEmbed;
ReplyBuilder.prototype.addSuggestionsEmbed = BooruReplyBuilder.prototype.addSuggestionsEmbed;
ReplyBuilder.prototype.addImageActionRow = BooruReplyBuilder.prototype.addImageActionRow;
ReplyBuilder.prototype.addTagsActionRow = BooruReplyBuilder.prototype.addTagsActionRow;
ReplyBuilder.prototype.addSuggestionsActionRow = BooruReplyBuilder.prototype.addSuggestionsActionRow;
