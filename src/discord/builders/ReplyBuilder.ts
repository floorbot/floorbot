import { Interaction, InteractionReplyOptions, Message } from "discord.js";
import { AttachmentBuilder } from "./AttachmentBuilder.js";
import { ActionRowBuilder } from "./ActionRowBuilder.js";
import { BuilderContext } from "./BuilderInterfaces.js";
import { EmbedBuilder } from "./EmbedBuilder.js";
import path from 'path';
import fs from 'fs';

export class ReplyBuilder implements InteractionReplyOptions {

    protected context?: BuilderContext;

    public files?: AttachmentBuilder[];
    public attachments?: AttachmentBuilder[];
    public components?: ActionRowBuilder[];
    public embeds?: EmbedBuilder[];
    public content?: string | null;

    constructor(data: BuilderContext | (InteractionReplyOptions & { context: BuilderContext; })) {
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

    public removeAttachments(): this {
        this.attachments = [];
        return this;
    }

    /**
     * This divides the core functions from the flavoured
     */

    /** Temporary method to use until a better solution is implemented */
    protected getAvatar(avatar: string): AttachmentBuilder {
        console.log('[dev] ReplyBuilder#getAvatar is a temporary solution...');
        const buffer = fs.readFileSync(`${path.resolve()}/res/avatars/${avatar}.png`);
        return new AttachmentBuilder(buffer, 'floorbot.png');
    }

    /** This is a unique helper function for consistent embeds */
    protected createEmbedBuilder(): EmbedBuilder {
        const embed = new EmbedBuilder();
        if (this.context) embed.setContextAuthor(this.context);
        return embed;
    }

    public addPageActionRow(link?: string, currentPage?: number, disabled?: boolean): this {
        const actionRow = new ActionRowBuilder();
        if (link) actionRow.addViewOnlineButton(link);
        actionRow.addPreviousPageButton(currentPage, disabled);
        actionRow.addNextPageButton(currentPage, disabled);
        return this.addActionRow(actionRow);
    }

    public addUnexpectedErrorEmbed(error: any): this {
        const buffer = fs.readFileSync(`${path.resolve()}/res/avatars/2-7.png`);
        const attachment = new AttachmentBuilder(buffer, 'floorbot.png');
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

    public addNotFoundEmbed(query?: string, message?: string): this {
        const buffer = fs.readFileSync(`${path.resolve()}/res/avatars/2-3.png`);
        const attachment = new AttachmentBuilder(buffer, 'floorbot.png');
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
}
