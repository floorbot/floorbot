import { DanbooruAPI, BooruResponseFactory, DanbooruHandler, BooruHandlerReply } from '../../../../..';
import { Message, MessageActionRow } from 'discord.js';
import { HandlerContext } from 'discord.js-commands';

export class DanbooruResponseFactory extends BooruResponseFactory {

    constructor(handler: DanbooruHandler) { super(handler); }

    public async generateResponse(context: HandlerContext, tags: string = String()): Promise<BooruHandlerReply> {
        const user = context instanceof Message ? context.author : context.user;
        const data = await DanbooruAPI.random(tags);
        if ('success' in data && !data.success) {
            const details = data.message || 'The database timed out running your query.'
            switch (details) {
                case 'You cannot search for more than 2 tags at a time.':
                    return this.handler.embedFactory.getTagLimitEmbed(context, 'basic', details.match(/\d+/)![1]!).toReplyOptions();
                case 'You cannot search for more than 6 tags at a time.':
                    return this.handler.embedFactory.getTagLimitEmbed(context, 'gold', details.match(/\d+/)![1]!).toReplyOptions();
                case 'You cannot search for more than 12 tags at a time.':
                    return this.handler.embedFactory.getTagLimitEmbed(context, 'platinum', details.match(/\d+/)![1]!).toReplyOptions();
                case 'The database timed out running your query.':
                    return this.handler.embedFactory.getTimeoutEmbed(context, tags).toReplyOptions();
                case 'That record was not found.':
                    const url404 = await DanbooruAPI.get404();
                    const autocomplete = await DanbooruAPI.autocomplete(tags);
                    const suggestions = autocomplete.slice(0, 25).map(tag => { return { name: tag.value, count: tag.post_count } });
                    const suggestionData = { suggestions, tags, url404 };
                    return {
                        embeds: [this.handler.embedFactory.getSuggestionEmbed(context, suggestionData)],
                        components: suggestions.length ? [this.handler.selectMenuFactory.getSuggestionSelectMenu(suggestionData, user).toActionRow()] : []
                    };
                default: throw details;
            }
        } else if (!('id' in data)) {
            return this.handler.embedFactory.getRestrictedTagEmbed(context, tags).toReplyOptions();
        }
        const postURL = `https://danbooru.donmai.us/posts/${data.id}`;
        return {
            embeds: [this.handler.embedFactory.getImageEmbed(context, { imageURL: data.large_file_url, score: data.score, postURL: postURL, tags: tags })],
            components: [new MessageActionRow().addComponents([
                this.handler.buttonFactory.getViewOnlineButton(postURL),
                this.handler.buttonFactory.getAgainButton(tags),
                this.handler.buttonFactory.getRecycleButton(tags, user)
            ])],
            imageURL: data.large_file_url
        }
    }
}
