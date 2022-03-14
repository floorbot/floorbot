import { Message, GuildMember, Interaction, APIEmbedField } from 'discord.js';
import { ResponseOptions, ReplyBuilder } from './ReplyBuilder.js';
import * as Builders from '@discordjs/builders';


export class EmbedBuilder extends Builders.EmbedBuilder {

    public override setAuthor(options: Builders.EmbedAuthorOptions | null | Message | Interaction): this {
        if (options instanceof Message || options instanceof Interaction) {
            const { member } = options;
            const user = options instanceof Message ? options.author : options.user;
            if (member && member instanceof GuildMember) {
                super.setAuthor({ name: member.displayName, iconURL: user.displayAvatarURL() });
                this.setColor(member.displayColor || 14840969);
            } else {
                super.setAuthor({ name: user.username, iconURL: user.displayAvatarURL() });
                this.setColor(14840969);
            }
            return this;
        }
        return super.setAuthor(options);
    }

    public override setDescription(description: string | null | string[]): this {
        if (Array.isArray(description)) return super.setDescription(description.join('\n'));
        return super.setDescription(description);
    }

    public addField(field: APIEmbedField): this {
        return this.addFields(field);
    }

    public toReplyOptions(replyOptions: ResponseOptions = {}): ReplyBuilder {
        return new ReplyBuilder(replyOptions).addEmbed(this);
    }
}
