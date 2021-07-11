import { MessageEmbed, GuildMember, Message, InteractionReplyOptions } from 'discord.js';
import { HandlerContext } from 'discord.js-commands';

export class AdminEmbed extends MessageEmbed {

    constructor(context: HandlerContext) {
        super();
        const { member } = (<{ member: GuildMember }>context);
        const displayName = member.displayName;
        const user = context instanceof Message ? context.author : context.user;
        this.setAuthor(displayName, user.displayAvatarURL());
        this.setColor(member.displayColor || 16711680);
    }

    public toReplyOptions(ephemeral: boolean = false): InteractionReplyOptions {
        return { embeds: [this], components: [], ephemeral: ephemeral };
    }
}
