import { MessageEmbed, MessageEmbedOptions, InteractionReplyOptions, Message, GuildMember, Interaction } from 'discord.js';

export class EmbedBuilder extends MessageEmbed {

    constructor(data?: MessageEmbed | MessageEmbedOptions) {
        super(data);
    }

    public setContextAuthor(context: Interaction | Message): this {
        const { member } = context;
        const user = context instanceof Message ? context.author : context.user;
        if (member && member instanceof GuildMember) {
            this.setAuthor(member.displayName, user.displayAvatarURL());
            this.setColor(member.displayColor || 14840969);
        } else {
            this.setAuthor(user.username, user.displayAvatarURL());
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
