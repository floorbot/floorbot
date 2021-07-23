import { BooruHandler, E621API, BooruButtonFactory, E621CommandData, BooruEmbedFactory, BooruHandlerReply, BooruSelectMenuFactory } from '../../../..';
import { Message, MessageActionRow } from 'discord.js';
import { HandlerContext } from 'discord.js-commands';

export class E621EmbedFactory extends BooruEmbedFactory {
    constructor(context: HandlerContext) {
        super(context);
        this.setFooter('Powered by E621', 'https://en.wikifur.com/w/images/d/dd/E621Logo.png');
    }
}

export class E621Handler extends BooruHandler {

    constructor() {
        super({
            commandData: E621CommandData,
            id: 'e621',
            nsfw: true
        });
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
                embeds: [E621EmbedFactory.getSuggestionEmbed(context, suggestionData)],
                components: suggestions.length ? [BooruSelectMenuFactory.getSuggestionSelectMenu(this, suggestionData, user).toActionRow()] : []
            };
        }
        const postURL = `https://e621.net/posts/${post.id}`;
        return {
            embeds: [E621EmbedFactory.getImageEmbed(context, { imageURL: post.file.url, score: post.score.total, postURL: postURL, tags: tags })],
            components: [new MessageActionRow().addComponents([
                BooruButtonFactory.getViewOnlineButton(this, postURL),
                BooruButtonFactory.getAgainButton(this, tags),
                BooruButtonFactory.getRecycleButton(this, tags, user)
            ])],
            imageURL: post.file.url
        }
    }
}
