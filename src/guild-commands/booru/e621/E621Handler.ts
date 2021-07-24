import { BooruHandler, E621CommandData, E621EmbedFactory, E621API, BooruHandlerReply } from '../../..';
import { Message, MessageActionRow } from 'discord.js';
import { HandlerContext } from 'discord.js-commands';

export class E621Handler extends BooruHandler {

    public override readonly embedFactory: E621EmbedFactory;

    constructor() {
        super({ id: 'e621', nsfw: true, commandData: E621CommandData });
        this.embedFactory = new E621EmbedFactory(this);
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
                embeds: [this.embedFactory.getSuggestionEmbed(context, suggestionData)],
                components: suggestions.length ? [this.selectMenuFactory.getSuggestionSelectMenu(suggestionData, user).toActionRow()] : []
            };
        }
        const postURL = `https://e621.net/posts/${post.id}`;
        return {
            embeds: [this.embedFactory.getImageEmbed(context, { imageURL: post.file.url, score: post.score.total, postURL: postURL, tags: tags })],
            components: [new MessageActionRow().addComponents([
                this.buttonFactory.getViewOnlineButton(postURL),
                this.buttonFactory.getAgainButton(tags),
                this.buttonFactory.getRecycleButton(tags, user)
            ])],
            imageURL: post.file.url
        }
    }
}
