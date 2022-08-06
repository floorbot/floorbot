import { BaseInteraction, EmbedAuthorOptions, EmbedBuilder, EmbedFooterOptions, GuildMember, Message } from 'discord.js';
import { HandlerContext } from 'discord.js-handlers';
import { ReplyBuilder, ResponseOptions } from './ReplyBuilder.js';

export class BetterEmbedBuilder extends EmbedBuilder {

    public override setAuthor(options: EmbedAuthorOptions | null | HandlerContext): this {
        const defaultColour = 14840969;
        if (options instanceof BaseInteraction || options instanceof Message) {
            const { member } = options;
            if (member && member instanceof GuildMember) {
                super.setAuthor({ name: member.displayName, iconURL: member.displayAvatarURL() });
                return this.setColor(member.displayColor || defaultColour);
            }
            const user = options instanceof Message ? options.author : options.user;
            super.setAuthor({ name: user.username, iconURL: user.displayAvatarURL() });
            return this.setColor(defaultColour);
        }
        return super.setAuthor(options);
    }

    public override setDescription(description: string | null | string[]): this {
        if (Array.isArray(description)) return super.setDescription(description.join('\n'));
        return super.setDescription(description);
    }

    public override setFooter(options: EmbedFooterOptions | { text: string[]; } | null): this {
        if (!options) return super.setFooter(options);
        return super.setFooter({
            ...options,
            text: Array.isArray(options.text) ?
                options.text.join(' ') :
                options.text
        });
    }

    public override toReplyOptions(replyOptions: ResponseOptions = {}): ReplyBuilder {
        return new ReplyBuilder(replyOptions).addEmbeds(this);
    }
};

declare module 'discord.js' {
    export interface EmbedBuilder {
        setAuthor(options: EmbedAuthorOptions | null | HandlerContext): this;
        setDescription(description: string | null | string[]): this;
        setFooter(options: EmbedFooterOptions | { text: string[]; } | null): this;
        toReplyOptions(replyOptions: ResponseOptions): ReplyBuilder;
    }
};

EmbedBuilder.prototype.setAuthor = BetterEmbedBuilder.prototype.setAuthor;
EmbedBuilder.prototype.setDescription = BetterEmbedBuilder.prototype.setDescription;
EmbedBuilder.prototype.setFooter = BetterEmbedBuilder.prototype.setFooter;
EmbedBuilder.prototype.toReplyOptions = BetterEmbedBuilder.prototype.toReplyOptions;
