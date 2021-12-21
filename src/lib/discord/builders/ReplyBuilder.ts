import { BaseCommandInteraction, Interaction, InteractionReplyOptions, Message, MessageMentionOptions } from "discord.js";
import { AvatarAttachmentExpression, ResourceAttachmentBuilder } from "../../../helpers/mixins/ResourceMixins.js";
import { PageableActionRowBuilder } from "../../../helpers/mixins/PageableMixins.js";
import { AttachmentBuilder } from "./AttachmentBuilder.js";
import { ActionRowBuilder } from "./ActionRowBuilder.js";
import { BuilderContext } from "./BuilderInterfaces.js";
import { Pageable } from "../../../helpers/Pageable.js";
import { EmbedBuilder } from "./EmbedBuilder.js";
import path from 'path';
import fs from 'fs';

export class ReplyBuilder implements InteractionReplyOptions {

    protected context?: BuilderContext;

    public allowed_mentions?: MessageMentionOptions;
    public attachments?: AttachmentBuilder[];
    public components?: ActionRowBuilder[];
    public ephemeral?: boolean | undefined;
    public files?: AttachmentBuilder[];
    public embeds?: EmbedBuilder[];
    public content?: string | null;

    constructor(data: BuilderContext | ReplyBuilder | (InteractionReplyOptions & { context: BuilderContext; })) {
        if (data) {
            if (data instanceof Interaction) this.context = data;
            else if (data instanceof Message) this.context = data;
            else Object.assign(this, data);
        }
    }

    public setContent(content: string | null): this {
        this.content = content;
        return this;
    }

    public setAllowedMentions(allowedMentions?: MessageMentionOptions): this {
        this.allowed_mentions = allowedMentions;
        return this;
    }

    public suppressMentions(): this {
        this.allowed_mentions = { ...this.allowed_mentions, parse: [] };
        return this;
    }

    public addEmbed(embed: EmbedBuilder): this {
        return this.addEmbeds(embed);
    }

    public addEmbeds(...embeds: EmbedBuilder[]): this {
        if (!this.embeds) this.embeds = [];
        this.embeds.push(...embeds);
        return this;
    }

    public addActionRow(actionRow: ActionRowBuilder): this {
        return this.addActionRows(actionRow);
    }

    public addActionRows(...actionRows: ActionRowBuilder[]): this {
        if (!this.components) this.components = [];
        this.components.push(...actionRows);
        return this;
    }

    public addFile(attachment: AttachmentBuilder): this {
        return this.addFiles(attachment);
    }

    public addFiles(...attachments: AttachmentBuilder[]): this {
        if (!this.files) this.files = [];
        this.files.push(...attachments);
        return this;
    }

    public clearAttachments(): this {
        this.attachments = [];
        return this;
    }

    public clearComponents(): this {
        this.components = [];
        return this;
    }

    public setEphemeral(ephemeral: boolean = true): this {
        this.ephemeral = ephemeral;
        return this;
    }

    /**
     * This divides the core functions from the flavoured
     */

    /** This is a special attachment to make embeds as wide as possible */
    protected getEmbedWidenerAttachment(): AttachmentBuilder {
        const buffer = fs.readFileSync(`${path.resolve()}/res/embed_widener.png`);
        return new AttachmentBuilder(buffer, 'embed_widener.png');
    }

    /** This is a unique helper function for consistent embeds */
    protected createEmbedBuilder(): EmbedBuilder {
        const embed = new EmbedBuilder();
        if (this.context) embed.setContextAuthor(this.context);
        return embed;
    }

    public addPageActionRow(link?: string, currentPage?: number | Pageable<any>, disabled?: boolean): this {
        const actionRow = new PageableActionRowBuilder();
        if (link) actionRow.addViewOnlineButton(link);
        actionRow.addPreviousPageButton(currentPage, disabled);
        actionRow.addNextPageButton(currentPage, disabled);
        return this.addActionRow(actionRow);
    }

    public addUnexpectedErrorEmbed(error: any): this {
        const attachment = ResourceAttachmentBuilder.createAvatarAttachment(AvatarAttachmentExpression.SAD_TEARS);
        const embed = this.createEmbedBuilder()
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription([
                `Sorry! I seem to have run into an unexpected error processing your request...`,
                `*The error has been reported and will be fixed in the future!*`,
                '',
                ...(typeof error === 'string' ? [`Message: \`${error}\``] : []),
                ...(error && error.message ? [`Message: \`${error.message}\``] : [])
            ]);
        this.addFile(attachment);
        this.addEmbed(embed);
        return this;
    }

    public addNotFoundEmbed(query?: string | null, message?: string | null): this {
        const attachment = ResourceAttachmentBuilder.createAvatarAttachment(AvatarAttachmentExpression.FROWN);
        const embed = this.createEmbedBuilder()
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription([
                `Sorry! I could not find any results for \`${query || 'your query'}\``,
                `*${message ?? 'Please check your spelling or try again later!'}*`
            ].join('\n'));
        this.addFile(attachment);
        this.addEmbed(embed);
        return this;
    }

    public addMissingContentEmbed(action: string): this {
        const attachment = ResourceAttachmentBuilder.createAvatarAttachment(AvatarAttachmentExpression.SMILE_CLOSED);
        const embed = this.createEmbedBuilder()
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription([
                `Sorry! It looks like that message has no content to ${action}`,
                `*Please make the correct changes before trying again!*`
            ].join('\n'));
        this.addEmbed(embed);
        this.addFile(attachment);
        this.setEphemeral();
        return this;
    }

    public addAdminOrOwnerEmbed(): this {
        const attachment = ResourceAttachmentBuilder.createAvatarAttachment(AvatarAttachmentExpression.MAD);
        const embed = this.createEmbedBuilder()
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription(
                this.context instanceof BaseCommandInteraction ?
                    [
                        'Sorry! Only an admin can use this command',
                        '*If appropriate ask an admin to help!*'
                    ] : [
                        'Sorry! Only the creator of this interaction can use this component',
                        '*If possible try using the command for yourself!*'
                    ]);
        this.addEmbed(embed);
        this.addFile(attachment);
        this.setEphemeral();
        return this;
    }

    public addGuildOnlyEmbed(): this {
        const attachment = ResourceAttachmentBuilder.createAvatarAttachment(AvatarAttachmentExpression.FROWN);
        const embed = this.createEmbedBuilder()
            .setContextAuthor(this.context!)
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription([
                `Sorry! It looks like I can only use this command in guilds!`,
                '*Make sure you\'re using this in an appropriate guild!*'
            ].join('\n'));
        this.addEmbed(embed);
        this.addFile(attachment);
        this.setEphemeral();
        return this;
    }
}
