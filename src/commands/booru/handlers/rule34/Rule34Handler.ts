import { BooruHandler, BooruHandlerReply, BooruCustomData, BooruEmbedFactory, BooruButtonFactory, BooruSelectMenuFactory, Rule34API, Rule34CommandData, Rule34APIAutocomplete } from '../../../..';
import { HandlerEmbed, HandlerContext } from 'discord.js-commands';
import { Message, MessageActionRow } from 'discord.js';

export class Rule34Handler extends BooruHandler {

    constructor() {
        super({ id: 'rule34', nsfw: true, commandData: Rule34CommandData });
    }

    public override getEmbedTemplate(context: HandlerContext, customData?: BooruCustomData): HandlerEmbed {
        return super.getEmbedTemplate(context, customData)
            .setFooter('Powered by Rule34', 'https://rule34.xxx/apple-touch-icon-precomposed.png');
    }

    public async generateResponse(context: HandlerContext, tags: string = String()): Promise<BooruHandlerReply> {
        const user = context instanceof Message ? context.author : context.user;
        const post = await Rule34API.random(tags);
        if (!post) {
            const url404 = await Rule34API.get404();
            const autocomplete = await Rule34API.autocomplete(tags);
            const suggestions = autocomplete.slice(0, 25).map((tag: Rule34APIAutocomplete) => { return { name: tag.value, count: tag.total } });
            return {
                embeds: [BooruEmbedFactory.getSuggestionEmbed(this, context, { suggestions, tags, url404 })],
                components: suggestions.length ? [BooruSelectMenuFactory.getSuggestionSelectMenu(this, { tags, suggestions, url404 }, user).toActionRow()] : []
            };
        }
        const postURL = `https://rule34.xxx/index.php?page=post&s=view&id=${post.id}`;
        return {
            embeds: [BooruEmbedFactory.getImageEmbed(this, context, { imageURL: post.file_url, score: parseInt(post.score), postURL: postURL, tags: tags })],
            components: [new MessageActionRow().addComponents([
                BooruButtonFactory.getViewOnlineButton(this, postURL),
                BooruButtonFactory.getAgainButton(this, tags),
                BooruButtonFactory.getRecycleButton(this, tags, user)
            ])],
            imageURL: post.file_url
        }
    }
}
