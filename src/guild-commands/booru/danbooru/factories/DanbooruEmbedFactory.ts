import { HandlerContext, HandlerEmbed } from 'discord.js-commands';
import { BooruHandler, BooruEmbedFactory } from '../../../../..';
import { MessageEmbed, MessageEmbedOptions } from 'discord.js';

export class DanbooruEmbedFactory extends BooruEmbedFactory {
    constructor(handler: BooruHandler) {
        super(handler);
    }

    public override getEmbedTemplate(context: HandlerContext, data?: MessageEmbed | MessageEmbedOptions): HandlerEmbed {
        return super.getEmbedTemplate(context, data)
            .setFooter('Powered by Danbooru', 'https://dl.airtable.com/.attachments/e0faba2e2b9f1cc1ad2b07b9ed6e63a3/9fdd81b5/512x512bb.jpg');
    }
}
