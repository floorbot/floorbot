import { ActionRowBuilder, BaseInteraction, BitField, InteractionReplyOptions, InteractionUpdateOptions, Message, MessageActionRowComponentBuilder, MessageCreateOptions, MessageFlags } from "discord.js";
import { HandlerContext } from 'discord.js-handlers';

export type ResponseOptions = InteractionReplyOptions & InteractionUpdateOptions & MessageCreateOptions;

export class ReplyBuilder implements InteractionReplyOptions, InteractionUpdateOptions, MessageCreateOptions {

    public readonly context?: HandlerContext;

    public ephemeral: ResponseOptions['ephemeral']; // reply only
    public fetchReply: ResponseOptions['fetchReply'];
    public flags: ResponseOptions['flags'];
    public tts: ResponseOptions['tts']; // reply only
    public content: ResponseOptions['content'];
    public embeds: ResponseOptions['embeds'];
    public allowedMentions: ResponseOptions['allowedMentions'];
    public files: ResponseOptions['files'];
    public components: ResponseOptions['components'];
    public attachments: ResponseOptions['attachments'];

    constructor(data?: HandlerContext | (ResponseOptions & { context?: HandlerContext; }) | null, persist?: boolean) {
        if (data) {
            if (data instanceof BaseInteraction) this.context = data;
            else if (data instanceof Message) this.context = data;
            // else if (data && 'user' in data) this.context = data;
            else Object.assign(this, data);
        }
        if (!persist) {
            this.clearAttachments();
            this.clearComponents();
        }
    }

    public setEphemeral(ephemeral: ResponseOptions['ephemeral'] = true): this {
        this.ephemeral = ephemeral;
        return this;
    }

    public setFetchReply(fetchReply: ResponseOptions['fetchReply'] = true): this {
        this.fetchReply = fetchReply;
        return this;
    }

    public setFlags(flags: ResponseOptions['flags']): this {
        this.flags = flags;
        return this;
    }

    public setTTS(tts: ResponseOptions['tts'] = true): this {
        this.tts = tts;
        return this;
    }

    public setContent(content: ResponseOptions['content'] | string[]): this {
        if (Array.isArray(content)) return this.setContent(content.join('\n'));
        this.content = content;
        return this;
    }

    public setEmbeds(...embeds: NonNullable<ResponseOptions['embeds']>): this {
        this.embeds = embeds;
        return this;
    }

    public addEmbeds(...embeds: NonNullable<ResponseOptions['embeds']>): this {
        if (!this.embeds) this.embeds = [];
        this.embeds.push(...embeds);
        return this;
    }

    public setAllowedMentions(allowedMentions: ResponseOptions['allowedMentions']): this {
        this.allowedMentions = allowedMentions;
        return this;
    }

    public setFiles(...files: NonNullable<ResponseOptions['files']>): this {
        this.files = files;
        return this;
    }

    public addFiles(...files: NonNullable<ResponseOptions['files']>): this {
        if (!this.files) this.files = [];
        this.files.push(...files);
        return this;
    }

    public setComponents(...components: NonNullable<ResponseOptions['components']>): this {
        this.components = components;
        return this;
    }

    public addComponents(...components: NonNullable<ResponseOptions['components']>): this {
        if (!this.components) this.components = [];
        this.components.push(...components);
        return this;
    }

    public setAttachments(...attachments: NonNullable<ResponseOptions['attachments']>): this {
        this.attachments = attachments;
        return this;
    }

    public addAttachments(...attachments: NonNullable<ResponseOptions['attachments']>): this {
        if (!this.attachments) this.attachments = [];
        this.attachments.push(...attachments);
        return this;
    }

    /**
     * These are some useful/alias functions
     */

    public suppressMentions(): this {
        this.allowedMentions = { ...this.allowedMentions, parse: [] };
        return this;
    }

    public suppressEmbeds(): this {
        const flagsBitField = new BitField(MessageFlags.SuppressEmbeds);
        if (this.flags) flagsBitField.add(this.flags);
        return this.setFlags(flagsBitField.bitfield);
    }

    public addActionRow(...components: MessageActionRowComponentBuilder[]): this {
        const actionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(components);
        return this.addComponents(actionRow);
    }

    public clearComponents(): this {
        this.components = [];
        return this;
    }

    public clearAttachments(): this {
        this.attachments = [];
        return this;
    }

    public static fromMessage(message: Message, context?: HandlerContext): ReplyBuilder {
        const builder = new ReplyBuilder(context);
        // builder.setEphemeral()
        // builder.setAllowedMentions({ parse: [] });
        builder.setFlags(message.flags.bitfield);
        builder.setTTS(message.tts);
        if (message.content) builder.setContent(message.content);
        if (message.embeds.length) builder.setEmbeds(...message.embeds);
        if (message.attachments.size) builder.setFiles(...message.attachments.values());
        if (message.components.length) builder.setComponents(...message.components);
        return builder;
    }
}
