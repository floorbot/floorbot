import { BooruHandler, BooruHandlerReply, BooruCustomData, BooruEmbedFactory, BooruButtonFactory, BooruSelectMenuFactory, SafebooruAPI, SafebooruCommandData } from '../../../..';
import { HandlerEmbed, HandlerContext } from 'discord.js-commands';
import { Message, MessageActionRow } from 'discord.js';

export class SafebooruHandler extends BooruHandler {

    constructor() {
        super({ id: 'safebooru', nsfw: false, commandData: SafebooruCommandData });
    }

    public override getEmbedTemplate(context: HandlerContext, customData?: BooruCustomData): HandlerEmbed {
        return super.getEmbedTemplate(context, customData)
            .setFooter('Powered by Safebooru', 'https://dl.airtable.com/.attachments/e0faba2e2b9f1cc1ad2b07b9ed6e63a3/9fdd81b5/512x512bb.jpg');
    }

    public async generateResponse(context: HandlerContext, tags: string = String()): Promise<BooruHandlerReply> {
        const user = context instanceof Message ? context.author : context.user;
        const data = await SafebooruAPI.random(tags);
        if ('success' in data && !data.success) {
            const details = data.message || 'The database timed out running your query.'
            switch (details) {
                case 'You cannot search for more than 2 tags at a time.':
                    return BooruEmbedFactory.getTagLimitEmbed(this, context, 'basic', details.match(/\d+/)![1]!).toReplyOptions();
                case 'You cannot search for more than 6 tags at a time.':
                    return BooruEmbedFactory.getTagLimitEmbed(this, context, 'gold', details.match(/\d+/)![1]!).toReplyOptions();
                case 'You cannot search for more than 12 tags at a time.':
                    return BooruEmbedFactory.getTagLimitEmbed(this, context, 'platinum', details.match(/\d+/)![1]!).toReplyOptions();
                case 'The database timed out running your query.':
                    return BooruEmbedFactory.getTimeoutEmbed(this, context, tags).toReplyOptions();
                case 'That record was not found.':
                    const url404 = await SafebooruAPI.get404();
                    const autocomplete = await SafebooruAPI.autocomplete(tags);
                    const suggestions = autocomplete.slice(0, 25).map(tag => { return { name: tag.value, count: tag.post_count } });
                    return {
                        embeds: [BooruEmbedFactory.getSuggestionEmbed(this, context, { suggestions, tags, url404 })],
                        components: suggestions.length ? [BooruSelectMenuFactory.getSuggestionSelectMenu(this, { tags, suggestions, url404 }, user).toActionRow()] : []
                    };
                default: throw { context, tags };
            }
        } else if (!('id' in data)) {
            return BooruEmbedFactory.getRestrictedTagEmbed(this, context, tags).toReplyOptions();
        }
        const postURL = `https://safebooru.donmai.us/posts/${data.id}`;
        return {
            embeds: [BooruEmbedFactory.getImageEmbed(this, context, { imageURL: data.large_file_url, score: data.score, postURL: postURL, tags: tags })],
            components: [new MessageActionRow().addComponents([
                BooruButtonFactory.getViewOnlineButton(this, postURL),
                BooruButtonFactory.getAgainButton(this, tags),
                BooruButtonFactory.getRecycleButton(this, tags, user)
            ])],
            imageURL: data.large_file_url
        }
    }
}
