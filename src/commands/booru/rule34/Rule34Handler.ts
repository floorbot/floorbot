import { BooruHandler, Rule34API, BooruButtonFactory, Rule34CommandData, BooruEmbedFactory, BooruHandlerReply, BooruSelectMenuFactory, Rule34APIAutocomplete } from '../../../..';
import { Message, MessageActionRow } from 'discord.js';
import { HandlerContext } from 'discord.js-commands';

export class Rule34EmbedFactory extends BooruEmbedFactory {
    constructor(context: HandlerContext) {
        super(context);
        this.setFooter('Powered by Rule34', 'https://rule34.xxx/apple-touch-icon-precomposed.png');
    }
}

export class Rule34Handler extends BooruHandler {

    constructor() {
        super({
            commandData: Rule34CommandData,
            id: 'rule34',
            nsfw: true
        });
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
                embeds: [Rule34EmbedFactory.getSuggestionEmbed(context, suggestionData)],
                components: suggestions.length ? [BooruSelectMenuFactory.getSuggestionSelectMenu(this, suggestionData, user).toActionRow()] : []
            };
        }
        const postURL = `https://rule34.xxx/index.php?page=post&s=view&id=${post.id}`;
        return {
            embeds: [Rule34EmbedFactory.getImageEmbed(context, { imageURL: post.file_url, score: parseInt(post.score), postURL: postURL, tags: tags })],
            components: [new MessageActionRow().addComponents([
                BooruButtonFactory.getViewOnlineButton(this, postURL),
                BooruButtonFactory.getAgainButton(this, tags),
                BooruButtonFactory.getRecycleButton(this, tags, user)
            ])],
            imageURL: post.file_url
        }
    }
}
