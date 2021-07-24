import { Rule34CommandData, Rule34EmbedFactory, BooruHandler, Rule34API, Rule34APIAutocomplete, BooruHandlerReply } from '../../..';
import { MessageActionRow, Message } from 'discord.js';
import { HandlerContext } from 'discord.js-commands';

export class Rule34Handler extends BooruHandler {

    public override readonly embedFactory: Rule34EmbedFactory;

    constructor() {
        super({ id: 'rule34', nsfw: true, commandData: Rule34CommandData });
        this.embedFactory = new Rule34EmbedFactory(this);
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
                embeds: [this.embedFactory.getSuggestionEmbed(context, suggestionData)],
                components: suggestions.length ? [this.selectMenuFactory.getSuggestionSelectMenu(suggestionData, user).toActionRow()] : []
            };
        }
        const postURL = `https://rule34.xxx/index.php?page=post&s=view&id=${post.id}`;
        return {
            embeds: [this.embedFactory.getImageEmbed(context, { imageURL: post.file_url, score: parseInt(post.score), postURL: postURL, tags: tags })],
            components: [new MessageActionRow().addComponents([
                this.buttonFactory.getViewOnlineButton(postURL),
                this.buttonFactory.getAgainButton(tags),
                this.buttonFactory.getRecycleButton(tags, user)
            ])],
            imageURL: post.file_url
        }
    }
}
