import { BooruHandler, SafebooruAPI, BooruButtonFactory, SafebooruCommandData, BooruEmbedFactory, BooruHandlerReply, BooruSelectMenuFactory } from '../../../..';
import { Message, MessageActionRow } from 'discord.js';
import { HandlerContext } from 'discord.js-commands';

export class SafebooruEmbedFactory extends BooruEmbedFactory {
    constructor(context: HandlerContext) {
        super(context);
        this.setFooter('Powered by Safebooru', 'https://dl.airtable.com/.attachments/e0faba2e2b9f1cc1ad2b07b9ed6e63a3/9fdd81b5/512x512bb.jpg');
    }
}

export class SafebooruHandler extends BooruHandler {

    constructor() {
        super({
            commandData: SafebooruCommandData,
            id: 'safebooru',
            nsfw: true
        });
    }

    public async generateResponse(context: HandlerContext, tags: string = String()): Promise<BooruHandlerReply> {
        const user = context instanceof Message ? context.author : context.user;
        const data = await SafebooruAPI.random(tags);
        if ('success' in data && !data.success) {
            const details = data.message || 'The database timed out running your query.'
            switch (details) {
                case 'You cannot search for more than 2 tags at a time.':
                    return SafebooruEmbedFactory.getTagLimitEmbed(context, 'basic', details.match(/\d+/)![1]!).toReplyOptions();
                case 'You cannot search for more than 6 tags at a time.':
                    return SafebooruEmbedFactory.getTagLimitEmbed(context, 'gold', details.match(/\d+/)![1]!).toReplyOptions();
                case 'You cannot search for more than 12 tags at a time.':
                    return SafebooruEmbedFactory.getTagLimitEmbed(context, 'platinum', details.match(/\d+/)![1]!).toReplyOptions();
                case 'The database timed out running your query.':
                    return SafebooruEmbedFactory.getTimeoutEmbed(context, tags).toReplyOptions();
                case 'That record was not found.':
                    const url404 = await SafebooruAPI.get404();
                    const autocomplete = await SafebooruAPI.autocomplete(tags);
                    const suggestions = autocomplete.slice(0, 25).map(tag => { return { name: tag.value, count: tag.post_count } });
                    const suggestionData = { suggestions, tags, url404 };
                    return {
                        embeds: [SafebooruEmbedFactory.getSuggestionEmbed(context, suggestionData)],
                        components: suggestions.length ? [BooruSelectMenuFactory.getSuggestionSelectMenu(this, suggestionData, user).toActionRow()] : []
                    };
                default: throw details;
            }
        } else if (!('id' in data)) {
            return BooruEmbedFactory.getRestrictedTagEmbed(context, tags).toReplyOptions();
        }
        const postURL = `https://safebooru.donmai.us/posts/${data.id}`;
        return {
            embeds: [BooruEmbedFactory.getImageEmbed(context, { imageURL: data.large_file_url, score: data.score, postURL: postURL, tags: tags })],
            components: [new MessageActionRow().addComponents([
                BooruButtonFactory.getViewOnlineButton(this, postURL),
                BooruButtonFactory.getAgainButton(this, tags),
                BooruButtonFactory.getRecycleButton(this, tags, user)
            ])],
            imageURL: data.large_file_url
        }
    }
}
