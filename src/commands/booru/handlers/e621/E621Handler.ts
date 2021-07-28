import { BooruHandler, BooruHandlerReply, BooruCustomData, BooruEmbedFactory, BooruButtonFactory, BooruSelectMenuFactory, E621API, E621CommandData } from '../../../..';
import { HandlerEmbed, HandlerContext } from 'discord.js-commands';
import { Message, MessageActionRow } from 'discord.js';

export class E621Handler extends BooruHandler {

    constructor() {
        super({ id: 'e621', nsfw: true, commandData: E621CommandData });
    }

    public override getEmbedTemplate(context: HandlerContext, customData?: BooruCustomData): HandlerEmbed {
        return super.getEmbedTemplate(context, customData)
            .setFooter('Powered by E621', 'https://en.wikifur.com/w/images/d/dd/E621Logo.png');
    }

    public async generateResponse(context: HandlerContext, tags: string = String()): Promise<BooruHandlerReply> {
        const user = context instanceof Message ? context.author : context.user;
        const post = await E621API.random(tags);
        if (!('file' in post)) {
            const url404 = await E621API.get404();
            const autocomplete = await E621API.autocomplete(tags);
            const suggestions = autocomplete.slice(0, 25).map(tag => { return { name: tag.name, count: tag.post_count } });
            return {
                embeds: [BooruEmbedFactory.getSuggestionEmbed(this, context, { suggestions, tags, url404 })],
                components: suggestions.length ? [BooruSelectMenuFactory.getSuggestionSelectMenu(this, { tags, suggestions, url404 }, user).toActionRow()] : []
            };
        }
        const postURL = `https://e621.net/posts/${post.id}`;
        return {
            embeds: [BooruEmbedFactory.getImageEmbed(this, context, { imageURL: post.file.url, score: post.score.total, postURL: postURL, tags: tags })],
            components: [new MessageActionRow().addComponents([
                BooruButtonFactory.getViewOnlineButton(this, postURL),
                BooruButtonFactory.getAgainButton(this, tags),
                BooruButtonFactory.getRecycleButton(this, tags, user)
            ])],
            imageURL: post.file.url
        }
    }
}
