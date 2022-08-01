import { Message, GuildMember, APIEmbedField, BaseInteraction } from 'discord.js';
import { ResponseOptions, ReplyBuilder } from './ReplyBuilder.js';
import { HandlerContext } from 'discord.js-handlers';
import * as Builders from '@discordjs/builders';

export class EmbedBuilder extends Builders.EmbedBuilder {

    public override setAuthor(options: Builders.EmbedAuthorOptions | null | HandlerContext): this {
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

    public override setFooter(options: Builders.EmbedFooterOptions | { text: string[]; } | null): this {
        if (!options) return super.setFooter(options);
        return super.setFooter({
            ...options,
            text: Array.isArray(options.text) ?
                options.text.join(' ') :
                options.text
        });
    }

    public addField(field: APIEmbedField): this {
        return this.addFields(field);
    }

    public toReplyOptions(replyOptions: ResponseOptions = {}): ReplyBuilder {
        return new ReplyBuilder(replyOptions).addEmbed(this);
    }
}
