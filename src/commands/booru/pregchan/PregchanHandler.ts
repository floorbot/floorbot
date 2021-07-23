import { BooruHandler, PregchanAPI, BooruButtonFactory, PregchanCommandData, BooruEmbedFactory, BooruHandlerReply } from '../../../..';
import { Message, MessageActionRow } from 'discord.js';
import { HandlerContext } from 'discord.js-commands';

export class PregchanEmbedFactory extends BooruEmbedFactory {
    constructor(context: HandlerContext) {
        super(context);
        this.setFooter('Powered by Pregchan', 'https://pregchan.com/favicons/favicon.ico');
    }
}

export class PregchanHandler extends BooruHandler {

    constructor() {
        super({
            commandData: PregchanCommandData,
            id: 'pregchan',
            nsfw: true
        });
    }

    public async generateResponse(context: HandlerContext, search: string = String()): Promise<BooruHandlerReply> {
        const user = context instanceof Message ? context.author : context.user;
        const post = await PregchanAPI.random(search);
        if (!post) return PregchanEmbedFactory.getSuggestionEmbed(context, { suggestions: [], tags: search, url404: null }).toReplyOptions();
        return {
            embeds: [PregchanEmbedFactory.getImageEmbed(context, { imageURL: post.imageURL, score: null, postURL: post.thread.url, tags: search })],
            components: [new MessageActionRow().addComponents([
                BooruButtonFactory.getViewOnlineButton(this, post.thread.url),
                BooruButtonFactory.getAgainButton(this, search),
                BooruButtonFactory.getRecycleButton(this, search, user)
            ])],
            imageURL: post.imageURL
        }
    }
}
