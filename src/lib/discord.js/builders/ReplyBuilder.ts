import { ActionRowBuilder, BaseInteraction, InteractionReplyOptions, InteractionUpdateOptions, Message, MessageActionRowComponentBuilder, MessageFlags, MessageFlagsBitField, MessageOptions, ReplyMessageOptions } from "discord.js";
import { AvatarAttachmentExpression, ResourceAttachmentBuilder } from '../../../helpers/ResourceMixins.js';
import { EmbedBuilder, EmbedBuilderData } from './EmbedBuilder.js';
import { HandlerContext } from 'discord.js-handlers';

export type ResponseOptions = InteractionReplyOptions & InteractionUpdateOptions & MessageOptions & ReplyMessageOptions;

export class ReplyBuilder implements InteractionReplyOptions, InteractionUpdateOptions {

    public static AUTO_AUTHOR = false;

    public readonly context?: HandlerContext;

    public ephemeral: ResponseOptions['ephemeral']; // reply only
    public fetchReply: ResponseOptions['fetchReply'];
    public flags: ResponseOptions['flags'];
    public tts: ResponseOptions['tts']; // reply only
    public nonce: ResponseOptions['nonce']; // reply only
    public content: ResponseOptions['content'];
    public embeds: ResponseOptions['embeds'];
    public allowedMentions: ResponseOptions['allowedMentions'];
    public files: ResponseOptions['files'];
    public components: ResponseOptions['components'];
    public attachments: ResponseOptions['attachments'];

    constructor(data?: HandlerContext | (ResponseOptions & { context?: HandlerContext; }) | null) {
        if (data) {
            if (data instanceof BaseInteraction) this.context = data;
            else if (data instanceof Message) this.context = data;
            else if (data && 'user' in data) this.context = data;
            else Object.assign(this, data);
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

    public setNonce(nonce: ResponseOptions['nonce']): this {
        this.nonce = nonce;
        return this;
    }

    public setContent(content: ResponseOptions['content'] | string[]): this {
        if (Array.isArray(content)) return this.setContent(content.join('\n'));
        this.content = content;
        return this;
    }

    public setEmbeds(embeds: ResponseOptions['embeds']): this {
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

    public setFiles(files: ResponseOptions['files']): this {
        this.files = files;
        return this;
    }

    public addFiles(...files: NonNullable<ResponseOptions['files']>): this {
        if (!this.files) this.files = [];
        this.files.push(...files);
        return this;
    }

    public setComponents(components: ResponseOptions['components']): this {
        this.components = components;
        return this;
    }

    public addComponents(...components: NonNullable<ResponseOptions['components']>): this {
        if (!this.components) this.components = [];
        this.components.push(...components);
        return this;
    }

    public setAttachments(attachments: ResponseOptions['attachments']): this {
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
        const flagsBitField = new MessageFlagsBitField(MessageFlags.SuppressEmbeds);
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
        if (message.nonce) builder.setNonce(message.nonce);
        if (message.content) builder.setContent(message.content);
        if (message.embeds.length) builder.setEmbeds(message.embeds);
        if (message.attachments.size) builder.setFiles([...message.attachments.values()]);
        if (message.components.length) builder.setComponents(message.components);
        return builder;
    }

    /**
     * This divides the core functions from the flavoured
     */

    /** This is a unique helper function for consistent embeds */
    protected createEmbedBuilder(data?: EmbedBuilderData): EmbedBuilder {
        const embed = new EmbedBuilder(data);
        if (ReplyBuilder.AUTO_AUTHOR && this.context) embed.setAuthor(this.context);
        return embed;
    }

    public addGuildOnlyEmbed(): this {
        const attachment = ResourceAttachmentBuilder.createAvatarAttachment(AvatarAttachmentExpression.FROWN);
        const embed = this.createEmbedBuilder()
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription([
                `Sorry! It looks like I can only use this feature in guilds!`,
                '*Make sure you try using this in an appropriate guild!*'
            ].join('\n'));
        if (this.context) embed.setAuthor(this.context);
        this.addEmbeds(embed);
        this.addFiles(attachment);
        this.setEphemeral();
        return this;
    }

    // /** This is a special attachment to make embeds as wide as possible */
    // protected getEmbedWidenerAttachment(): AttachmentBuilder {
    //     const buffer = fs.readFileSync(`${path.resolve()}/res/embed_widener.png`);
    //     return new AttachmentBuilder(buffer, { name: 'embed_widener.png' });
    // }

    // public addUnexpectedErrorEmbed(error: any): this {
    //     console.error('[error] Unexpected Error', error);
    //     const attachment = ResourceAttachmentBuilder.createAvatarAttachment(AvatarAttachmentExpression.SAD_TEARS);
    //     const embed = this.createEmbedBuilder()
    //         .setThumbnail(attachment.getEmbedUrl())
    //         .setDescription([
    //             `Sorry! I seem to have run into an unexpected error processing your request...`,
    //             `*The error has been reported and will be fixed in the future!*`,
    //             '',
    //             ...(typeof error === 'string' ? [`Message: \`${error}\``] : []),
    //             ...(error && error.message ? [`Message: \`${error.message}\``] : [])
    //         ]);
    //     this.addFile(attachment);
    //     this.addEmbed(embed);
    //     return this;
    // }

    // public addUnknownComponentEmbed(component: MessageComponentInteraction): this {
    //     console.warn(`[support] Unknown ${component.constructor.name} - <${component.customId}>`);
    //     const attachment = ResourceAttachmentBuilder['createAvatarAttachment'](AvatarAttachmentExpression.SAD);
    //     const embed = this.createEmbedBuilder()
    //         .setThumbnail(attachment.getEmbedUrl())
    //         .setDescription([
    //             `Sorry! I'm not sure how to handle the \`${component.customId}\` component...`,
    //             `*The issue has been reported and will be fixed in the future!*`
    //         ]);
    //     this.addFile(attachment);
    //     this.addEmbed(embed);
    //     return this;
    // }

    // public addNotFoundEmbed(query?: string | null, message?: string | null): this {
    //     const attachment = ResourceAttachmentBuilder.createAvatarAttachment(AvatarAttachmentExpression.FROWN);
    //     const embed = this.createEmbedBuilder()
    //         .setThumbnail(attachment.getEmbedUrl())
    //         .setDescription([
    //             `Sorry! I could not find any results for \`${query || 'your query'}\``,
    //             `*${message ?? 'Please check your spelling or try again later!'}*`
    //         ].join('\n'));
    //     this.addFile(attachment);
    //     this.addEmbed(embed);
    //     return this;
    // }

    // public addMissingContentEmbed(action: string): this {
    //     const attachment = ResourceAttachmentBuilder.createAvatarAttachment(AvatarAttachmentExpression.SMILE_CLOSED);
    //     const embed = this.createEmbedBuilder()
    //         .setThumbnail(attachment.getEmbedUrl())
    //         .setDescription([
    //             `Sorry! It looks like that message has no content to ${action}`,
    //             `*Please make the correct changes before trying again!*`
    //         ].join('\n'));
    //     this.addEmbed(embed);
    //     this.addFile(attachment);
    //     this.setEphemeral();
    //     return this;
    // }

    // public addAdminOrOwnerEmbed(): this {
    //     const attachment = ResourceAttachmentBuilder.createAvatarAttachment(AvatarAttachmentExpression.MAD);
    //     const embed = this.createEmbedBuilder()
    //         .setThumbnail(attachment.getEmbedUrl())
    //         .setDescription(
    //             this.context instanceof CommandInteraction ? [
    //                 'Sorry! Only an admin can use this command',
    //                 '*If appropriate ask an admin to help!*'
    //             ] : [
    //                 'Sorry! Only the creator of this interaction can use this component',
    //                 '*If possible try using the command for yourself!*'
    //             ]);
    //     this.addEmbed(embed);
    //     this.addFile(attachment);
    //     this.setEphemeral();
    //     return this;
    // }

    // public addOwnerEmbed(): this {
    //     const attachment = ResourceAttachmentBuilder.createAvatarAttachment(AvatarAttachmentExpression.MAD);
    //     const embed = this.createEmbedBuilder()
    //         .setThumbnail(attachment.getEmbedUrl())
    //         .setDescription([
    //             'Sorry! Only an owner can use this feature',
    //             '*If appropriate ask an admin to help!*'
    //         ]);
    //     this.addEmbed(embed);
    //     this.addFile(attachment);
    //     this.setEphemeral();
    //     return this;
    // }

    // public addNSFWChannelOnlyEmbed(): this {
    //     const attachment = ResourceAttachmentBuilder.createAvatarAttachment(AvatarAttachmentExpression.CHEEKY);
    //     const embed = this.createEmbedBuilder()
    //         .setThumbnail(attachment.getEmbedUrl())
    //         .setDescription([
    //             `Sorry! It looks like I can only use this command in \`NSFW\` channels!`,
    //             '*Try a different channel or make this one NSFW if it is appropriate!*'
    //         ].join('\n'));
    //     if (this.context) embed.setAuthor(this.context);
    //     this.addEmbed(embed);
    //     this.addFile(attachment);
    //     this.setEphemeral();
    //     return this;
    // }
}
