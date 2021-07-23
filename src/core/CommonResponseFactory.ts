import { ResponseFactory, HandlerContext, HandlerEmbed } from 'discord.js-commands';
import { CommonHandler } from '../..';

export class CommonResponseFactory<H extends CommonHandler> extends ResponseFactory<H> {

    constructor(handler: H) {
        super(handler);
    }

    public getForbiddenEmbed(context: HandlerContext, handler: H, reason: string) {
        const type = this.getContextName(context);
        return new HandlerEmbed(context)
            .setDescription([
                `Sorry! You do not have permission to use \`${handler.id}\` ${type}s!`,
                `*${reason}*`
            ].join('\n'));
    }
}
