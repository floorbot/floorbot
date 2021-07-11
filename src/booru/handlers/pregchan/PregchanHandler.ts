import { BooruHandler, BooruHandlerReply } from '../../BooruHandler';
import { CommandClient, HandlerContext } from 'discord.js-commands';
import { PregchanCommandData } from './PregchanCommandData';
import { Message, MessageActionRow } from 'discord.js';
import { PregchanAPI } from './PregchanAPI';

import { SuggestionEmbed } from '../../message/embeds/SuggestionEmbed';
import { ImageEmbed } from '../../message/embeds/ImageEmbed';

import { ViewOnlineButton } from '../../message/buttons/ViewOnlineButton';
import { RecycleButton } from '../../message/buttons/RecycleButton';
import { AgainButton } from '../../message/buttons/AgainButton';

export class PregchanHandler extends BooruHandler {

    constructor(client: CommandClient) {
        super(client, {
            id: 'pregchan',
            name: 'Pregchan',
            nsfw: true
        }, PregchanCommandData);
    }

    public getEmbedTemplate(context: HandlerContext) {
        return super.getEmbedTemplate(context)
            .setFooter('Powered by Pregchan', 'https://pregchan.com/favicons/favicon.ico');
    }

    public async generateResponse(context: HandlerContext, search: string = String()): Promise<BooruHandlerReply> {
        const user = context instanceof Message ? context.author : context.user;
        const templateEmbed = this.getEmbedTemplate(context);
        const post = await PregchanAPI.random(search);

        if (!post) {
            return {
                embeds: [new SuggestionEmbed(templateEmbed, { suggestions: [], tags: search, url404: null })],
                components: []
            };
        }

        return {
            embeds: [new ImageEmbed(templateEmbed, { imageURL: post.imageURL, score: null, postURL: post.thread.url, tags: search })],
            components: [new MessageActionRow().addComponents([new ViewOnlineButton(post.thread.url), new AgainButton(this, search), new RecycleButton(this, search, user)])],
            imageURL: post.imageURL
        }
    }
}
