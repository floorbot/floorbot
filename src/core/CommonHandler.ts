import { BaseHandler, HandlerOptions, HandlerContext, HandlerEmbed } from 'discord.js-commands';
import { GuildMember, Permissions, InteractionReplyOptions } from 'discord.js';

export abstract class CommonHandler extends BaseHandler {

    constructor(options: HandlerOptions) {
        super(options);
    }

    public isAdmin(context: HandlerContext) {
        const { member } = <{ member: GuildMember }>context
        return member && member.permissions.has(Permissions.FLAGS.ADMINISTRATOR);
    }

    public getForbiddenResponse(context: HandlerContext, reason: string): InteractionReplyOptions {
        const type = this.getContextName(context);
        return new HandlerEmbed(context).setDescription([
            `Sorry! You do not have permission to use \`${this.id}\` ${type}s!`,
            `*${reason}*`
        ].join('\n')).toReplyOptions(true);
    }
}
