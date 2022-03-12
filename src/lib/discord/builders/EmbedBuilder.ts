import { MessageEmbed, MessageEmbedOptions, InteractionReplyOptions, Message, GuildMember } from 'discord.js';
import { BuilderContext } from './BuilderInterfaces.js';

export class EmbedBuilder extends MessageEmbed {

    constructor(data?: MessageEmbed | MessageEmbedOptions) {
        super(data);
    }

    public setContextAuthor(context: BuilderContext): this {
        const { member } = context;
        const user = context instanceof Message ? context.author : context.user;
        if (member && member instanceof GuildMember) {
            this.setAuthor({ name: member.displayName, iconURL: user.displayAvatarURL() });
            this.setColor(member.displayColor || 14840969);
        } else {
            this.setAuthor({ name: user.username, iconURL: user.displayAvatarURL() });
            this.setColor(14840969);
        }
        return this;
    }

    public override setDescription(description: string | string[]): this {
        if (Array.isArray(description)) return super.setDescription(description.join('\n'));
        return super.setDescription(description);
    }

    public override addField(name: string, value: string | string[], inline?: boolean): this {
        if (Array.isArray(value)) return super.addField(name, value.join('\n'), inline);
        return super.addField(name, value, inline);
    }

    public toReplyOptions(replyOptions: InteractionReplyOptions = {}): InteractionReplyOptions {
        return { ...replyOptions, embeds: [...(replyOptions.embeds || []), this] };
    }
}
