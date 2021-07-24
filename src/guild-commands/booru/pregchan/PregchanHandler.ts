import { BooruHandler, PregchanCommandData, PregchanEmbedFactory, PregchanAPI, BooruHandlerReply } from '../../..';
import { Message, MessageActionRow } from 'discord.js';
import { HandlerContext } from 'discord.js-commands';

export class PregchanHandler extends BooruHandler {

    public override readonly embedFactory: PregchanEmbedFactory;

    constructor() {
        super({ id: 'pregchan', nsfw: true, commandData: PregchanCommandData });
        this.embedFactory = new PregchanEmbedFactory(this);
    }

    public async generateResponse(context: HandlerContext, search: string = String()): Promise<BooruHandlerReply> {
        const user = context instanceof Message ? context.author : context.user;
        const post = await PregchanAPI.random(search);
        if (!post) return this.embedFactory.getSuggestionEmbed(context, { suggestions: [], tags: search, url404: null }).toReplyOptions();
        return {
            embeds: [this.embedFactory.getImageEmbed(context, { imageURL: post.imageURL, score: null, postURL: post.thread.url, tags: search })],
            components: [new MessageActionRow().addComponents([
                this.buttonFactory.getViewOnlineButton(post.thread.url),
                this.buttonFactory.getAgainButton(search),
                this.buttonFactory.getRecycleButton(search, user)
            ])],
            imageURL: post.imageURL
        }
    }
}
