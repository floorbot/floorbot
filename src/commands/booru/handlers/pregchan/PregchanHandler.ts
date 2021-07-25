import { BooruHandler, BooruHandlerReply, BooruCustomData, BooruEmbedFactory, BooruButtonFactory, PregchanAPI, PregchanCommandData } from '../../../..';
import { HandlerEmbed, HandlerContext } from 'discord.js-commands';
import { Message, MessageActionRow } from 'discord.js';

export class PregchanHandler extends BooruHandler {

    constructor() {
        super({ id: 'pregchan', nsfw: true, commandData: PregchanCommandData });
    }

    public override getEmbedTemplate(context: HandlerContext, customData?: BooruCustomData): HandlerEmbed {
        return super.getEmbedTemplate(context, customData)
            .setFooter('Powered by Pregchan', 'https://pregchan.com/favicons/favicon.ico');
    }

    public async generateResponse(context: HandlerContext, search: string = String()): Promise<BooruHandlerReply> {
        const user = context instanceof Message ? context.author : context.user;
        const post = await PregchanAPI.random(search);

        if (!post) { return BooruEmbedFactory.getSuggestionEmbed(this, context, { suggestions: [], tags: search, url404: null }).toReplyOptions() }

        return {
            embeds: [BooruEmbedFactory.getImageEmbed(this, context, { imageURL: post.imageURL, score: null, postURL: post.thread.url, tags: search })],
            components: [new MessageActionRow().addComponents([
                BooruButtonFactory.getViewOnlineButton(this, post.thread.url),
                BooruButtonFactory.getAgainButton(this, search),
                BooruButtonFactory.getRecycleButton(this, search, user)
            ])],
            imageURL: post.imageURL
        }
    }
}
