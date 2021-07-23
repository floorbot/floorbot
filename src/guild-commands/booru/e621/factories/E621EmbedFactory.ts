import { HandlerContext, HandlerEmbed } from 'discord.js-commands';
import { MessageEmbed, MessageEmbedOptions } from 'discord.js';
import { BooruHandler, BooruEmbedFactory } from '../../../..';

export class E621EmbedFactory extends BooruEmbedFactory {
    constructor(handler: BooruHandler) {
        super(handler);
    }

    public override getEmbedTemplate(context: HandlerContext, data?: MessageEmbed | MessageEmbedOptions): HandlerEmbed {
        return super.getEmbedTemplate(context, data)
            .setFooter('Powered by E621', 'https://en.wikifur.com/w/images/d/dd/E621Logo.png');
    }
}
