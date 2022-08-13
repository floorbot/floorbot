import { APIEmbedField, BaseInteraction, EmbedAuthorOptions, EmbedFooterOptions, GuildMember, Message, RestOrArray } from 'discord.js';
import { ReplyBuilder, ResponseOptions } from './ReplyBuilder.js';
import { HandlerContext } from 'discord.js-handlers';
import * as Discord from 'discord.js';

export type EmbedBuilderData = ConstructorParameters<typeof Discord.EmbedBuilder>[0] & { context?: HandlerContext; };

export class EmbedBuilder extends Discord.EmbedBuilder {

    public static DEFAULT_COLOUR = 14840969;

    constructor(data?: EmbedBuilderData) {
        super(data);
        this.setColor(EmbedBuilder.DEFAULT_COLOUR);
        if (data && data.context) this.setAuthor(data.context);
    }

    public override setAuthor(options: EmbedAuthorOptions | HandlerContext | null): this {
        if (options instanceof BaseInteraction || options instanceof Message) {
            const { member } = options;
            if (member && member instanceof GuildMember) {
                super.setAuthor({ name: member.displayName, iconURL: member.displayAvatarURL() });
                return this.setColor(member.displayColor || EmbedBuilder.DEFAULT_COLOUR);
            }
            const user = options instanceof Message ? options.author : options.user;
            super.setAuthor({ name: user.username, iconURL: user.displayAvatarURL() });
            return this.setColor(EmbedBuilder.DEFAULT_COLOUR);
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

    public override setFields(...fields: RestOrArray<Pick<APIEmbedField, 'name' | 'inline'> & { value: string | string[]; }>): this {
        for (const field of [fields].flat(2)) { if (Array.isArray(field.value)) field.value = field.value.join('\n'); }
        return super.setFields(...fields as APIEmbedField[]);
    }

    public override addFields(...fields: RestOrArray<Pick<APIEmbedField, 'name' | 'inline'> & { value: string | string[]; }>): this {
        for (const field of [fields].flat(2)) { if (Array.isArray(field.value)) field.value = field.value.join('\n'); }
        return super.addFields(...fields as APIEmbedField[]);
    }

    public toReplyOptions(replyOptions: ResponseOptions = {}): ReplyBuilder {
        return new ReplyBuilder(replyOptions).addEmbeds(this);
    }
};
