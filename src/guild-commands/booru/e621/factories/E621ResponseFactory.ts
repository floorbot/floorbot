import { E621API, BooruResponseFactory, E621Handler, BooruHandlerReply } from '../../../..';
import { Message, MessageActionRow } from 'discord.js';
import { HandlerContext } from 'discord.js-commands';

export class E621ResponseFactory extends BooruResponseFactory {

    constructor(handler: E621Handler) {
        super(handler);
    }

    public async generateResponse(context: HandlerContext, tags: string = String()): Promise<BooruHandlerReply> {
        const user = context instanceof Message ? context.author : context.user;
        const post = await E621API.random(tags);
        if (!('file' in post)) {
            const url404 = await E621API.get404();
            const autocomplete = await E621API.autocomplete(tags);
            const suggestions = autocomplete.slice(0, 25).map(tag => { return { name: tag.name, count: tag.post_count } });
            const suggestionData = { suggestions, tags, url404 };
            return {
                embeds: [this.handler.embedFactory.getSuggestionEmbed(context, suggestionData)],
                components: suggestions.length ? [this.handler.selectMenuFactory.getSuggestionSelectMenu(suggestionData, user).toActionRow()] : []
            };
        }
        const postURL = `https://e621.net/posts/${post.id}`;
        return {
            embeds: [this.handler.embedFactory.getImageEmbed(context, { imageURL: post.file.url, score: post.score.total, postURL: postURL, tags: tags })],
            components: [new MessageActionRow().addComponents([
                this.handler.buttonFactory.getViewOnlineButton(postURL),
                this.handler.buttonFactory.getAgainButton(tags),
                this.handler.buttonFactory.getRecycleButton(tags, user)
            ])],
            imageURL: post.file.url
        }
    }
}
