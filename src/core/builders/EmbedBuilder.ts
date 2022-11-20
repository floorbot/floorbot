import Discord, { GuildMember, Message } from 'discord.js';
import { HandlerContext } from 'discord.js-handlers';

export class EmbedBuilder extends Discord.EmbedBuilder {

    public static DEFAULT_COLOUR = 14840969;

    public override setContextAuthor(context: HandlerContext | null): this {
        if (!context) return this.setAuthor(context);
        const { member } = context;
        if (member && member instanceof GuildMember) {
            return this.setAuthor({ name: member.displayName, iconURL: member.displayAvatarURL() });
        }
        const user = context instanceof Message ? context.author : context.user;
        return this.setAuthor({ name: user.username, iconURL: user.displayAvatarURL() });
    };

    public override setContextColor(context: HandlerContext | null): this {
        if (!context) return this.setAuthor(context);
        const { member } = context;
        if (member && member instanceof GuildMember) {
            return this.setColor(member.displayColor || EmbedBuilder.DEFAULT_COLOUR);
        }
        return this.setColor(EmbedBuilder.DEFAULT_COLOUR);
    };
}

declare module 'discord.js' {
    export interface EmbedBuilder {
        DEFAULT_COLOUR: number;
        setContextAuthor(context: HandlerContext | null): this;
        setContextColor(context: HandlerContext | null): this;
    }
};

Discord.EmbedBuilder.prototype.setContextAuthor = EmbedBuilder.prototype.setContextAuthor;
Discord.EmbedBuilder.prototype.setContextColor = EmbedBuilder.prototype.setContextColor;
