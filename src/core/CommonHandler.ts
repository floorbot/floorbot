import { BaseHandler, HandlerOptions, HandlerContext } from 'discord.js-commands';
import { GuildMember, Permissions } from 'discord.js';
import { CommonResponseFactory } from '../..';

export abstract class CommonHandler extends BaseHandler {

    abstract override readonly responseFactory: CommonResponseFactory<CommonHandler>;

    constructor(options: HandlerOptions) {
        super(options);
    }

    public isAdmin(context: HandlerContext) {
        const { member } = <{ member: GuildMember }>context
        return member && member.permissions.has(Permissions.FLAGS.ADMINISTRATOR);
    }
}
