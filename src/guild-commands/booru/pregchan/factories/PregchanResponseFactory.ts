import { PregchanAPI, BooruResponseFactory, PregchanHandler, BooruHandlerReply } from '../../../..';
import { Message, MessageActionRow } from 'discord.js';
import { HandlerContext } from 'discord.js-commands';

export class PregchanResponseFactory extends BooruResponseFactory {

    constructor(handler: PregchanHandler) {
        super(handler);
    }

    public async generateResponse(context: HandlerContext, search: string = String()): Promise<BooruHandlerReply> {
        const user = context instanceof Message ? context.author : context.user;
        const post = await PregchanAPI.random(search);
        if (!post) return this.handler.embedFactory.getSuggestionEmbed(context, { suggestions: [], tags: search, url404: null }).toReplyOptions();
        return {
            embeds: [this.handler.embedFactory.getImageEmbed(context, { imageURL: post.imageURL, score: null, postURL: post.thread.url, tags: search })],
            components: [new MessageActionRow().addComponents([
                this.handler.buttonFactory.getViewOnlineButton(post.thread.url),
                this.handler.buttonFactory.getAgainButton(search),
                this.handler.buttonFactory.getRecycleButton(search, user)
            ])],
            imageURL: post.imageURL
        }
    }
}
