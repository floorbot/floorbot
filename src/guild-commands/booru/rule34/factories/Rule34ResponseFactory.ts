import { Rule34API, BooruResponseFactory, Rule34Handler, BooruHandlerReply, Rule34APIAutocomplete } from '../../../..';
import { Message, MessageActionRow } from 'discord.js';
import { HandlerContext } from 'discord.js-commands';

export class Rule34ResponseFactory extends BooruResponseFactory {

    constructor(handler: Rule34Handler) {
        super(handler);
    }

    public async generateResponse(context: HandlerContext, tags: string = String()): Promise<BooruHandlerReply> {
        const user = context instanceof Message ? context.author : context.user;
        const post = await Rule34API.random(tags);
        if (!post) {
            const url404 = await Rule34API.get404();
            const autocomplete = await Rule34API.autocomplete(tags);
            const suggestions = autocomplete.slice(0, 25).map((tag: Rule34APIAutocomplete) => { return { name: tag.value, count: tag.total } });
            const suggestionData = { suggestions, tags, url404 };
            return {
                embeds: [this.handler.embedFactory.getSuggestionEmbed(context, suggestionData)],
                components: suggestions.length ? [this.handler.selectMenuFactory.getSuggestionSelectMenu(suggestionData, user).toActionRow()] : []
            };
        }
        const postURL = `https://rule34.xxx/index.php?page=post&s=view&id=${post.id}`;
        return {
            embeds: [this.handler.embedFactory.getImageEmbed(context, { imageURL: post.file_url, score: parseInt(post.score), postURL: postURL, tags: tags })],
            components: [new MessageActionRow().addComponents([
                this.handler.buttonFactory.getViewOnlineButton(postURL),
                this.handler.buttonFactory.getAgainButton(tags),
                this.handler.buttonFactory.getRecycleButton(tags, user)
            ])],
            imageURL: post.file_url
        }
    }
}
