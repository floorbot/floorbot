import { HandlerContext, HandlerEmbed } from 'discord.js-commands';
import { MessageEmbed, MessageEmbedOptions } from 'discord.js';
import { BooruHandler, BooruEmbedFactory } from '../../../..';

export class SafebooruEmbedFactory extends BooruEmbedFactory {
    constructor(handler: BooruHandler) {
        super(handler);
    }

    public override getEmbedTemplate(context: HandlerContext, data?: MessageEmbed | MessageEmbedOptions): HandlerEmbed {
        return super.getEmbedTemplate(context, data)
            .setFooter('Powered by Safebooru', 'https://dl.airtable.com/.attachments/e0faba2e2b9f1cc1ad2b07b9ed6e63a3/9fdd81b5/512x512bb.jpg');
    }
}
