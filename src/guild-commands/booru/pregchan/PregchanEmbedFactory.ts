import { HandlerContext, HandlerEmbed } from 'discord.js-commands';
import { MessageEmbed, MessageEmbedOptions } from 'discord.js';
import { BooruHandler, BooruEmbedFactory } from '../../../..';

export class PregchanEmbedFactory extends BooruEmbedFactory {
    constructor(handler: BooruHandler) {
        super(handler);
    }

    public override getEmbedTemplate(context: HandlerContext, data?: MessageEmbed | MessageEmbedOptions): HandlerEmbed {
        return super.getEmbedTemplate(context, data)
            .setFooter('Powered by Pregchan', 'https://pregchan.com/favicons/favicon.ico');
    }
}
