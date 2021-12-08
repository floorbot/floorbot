import { Interaction, InteractionReplyOptions, Message } from "discord.js";
import { ActionRowBuilder } from "./ActionRowBuilder";
import { EmbedBuilder } from "./EmbedBuilder";

export type Context = Interaction | Message;

export class ReplyBuilder implements InteractionReplyOptions {

    public components?: ActionRowBuilder[];
    public embeds?: EmbedBuilder[];
    public content?: string | null;

    constructor(replyOptions: InteractionReplyOptions = {}) {
        Object.assign(this, replyOptions);
    }

    public setContent(content: string | null): this {
        this.content = content;
        return this;
    }

    public addEmbeds(...embeds: EmbedBuilder[]): this {
        if (!this.embeds) this.embeds = [];
        this.embeds.push(...embeds);
        return this;
    }

    public addActionRow(actionRow: ActionRowBuilder): this {
        if (!this.components) this.components = [];
        this.components.push(actionRow);
        return this;
    }
}