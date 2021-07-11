import { CommandClient, HandlerContext } from 'discord.js-commands';
import { BooruHandler, BooruHandlerReply } from '../../BooruHandler';
import { SafebooruCommandData } from './SafebooruCommandData';
import { Message, MessageActionRow } from 'discord.js';
import { SafebooruAPI } from './SafebooruAPI';

import { SuggestionEmbed } from '../../message/embeds/SuggestionEmbed';
import { TagLimitEmbed } from '../../message/embeds/TagLimitEmbed';
import { TimeoutEmbed } from '../../message/embeds/TimeoutEmbed';
import { ErrorEmbed } from '../../message/embeds/ErrorEmbed';
import { ImageEmbed } from '../../message/embeds/ImageEmbed';

import { ViewOnlineButton } from '../../message/buttons/ViewOnlineButton';
import { RecycleButton } from '../../message/buttons/RecycleButton';
import { AgainButton } from '../../message/buttons/AgainButton';

import { SuggestionSelectMenu } from '../../message/selectmenus/SuggestionSelectMenu';

export class SafebooruHandler extends BooruHandler {

    constructor(client: CommandClient) {
        super(client, {
            id: 'safebooru',
            name: 'Safebooru',
            nsfw: false
        }, SafebooruCommandData);
    }

    public getEmbedTemplate(context: HandlerContext) {
        return super.getEmbedTemplate(context)
            .setFooter('Powered by Safebooru', 'https://dl.airtable.com/.attachments/e0faba2e2b9f1cc1ad2b07b9ed6e63a3/9fdd81b5/512x512bb.jpg');
    }

    public async generateResponse(context: HandlerContext, tags: string = String()): Promise<BooruHandlerReply> {
        const user = context instanceof Message ? context.author : context.user;
        const templateEmbed = this.getEmbedTemplate(context);
        const data = await SafebooruAPI.random(tags);
        if ('success' in data && !data.success) {
            const details = data.message || 'The database timed out running your query.'
            switch (details) {
                case 'You cannot search for more than 2 tags at a time.':
                    return { embeds: [new TagLimitEmbed(templateEmbed, { maxTags: details.match(/\d+/)![1], accountType: 'basic' })], components: [] };
                case 'You cannot search for more than 6 tags at a time.':
                    return { embeds: [new TagLimitEmbed(templateEmbed, { maxTags: details.match(/\d+/)![1], accountType: 'gold' })], components: [] };
                case 'You cannot search for more than 12 tags at a time.':
                    return { embeds: [new TagLimitEmbed(templateEmbed, { maxTags: details.match(/\d+/)![1], accountType: 'platinum' })], components: [] };
                case 'The database timed out running your query.':
                    return { embeds: [new TimeoutEmbed(templateEmbed, tags)], components: [] }
                case 'That record was not found.':
                    const url404 = await SafebooruAPI.get404();
                    const autocomplete = await SafebooruAPI.autocomplete(tags);
                    const suggestions = autocomplete.slice(0, 25).map(tag => { return { name: tag.value, count: tag.post_count } });
                    return {
                        embeds: [new SuggestionEmbed(templateEmbed, { suggestions, tags, url404 })],
                        components: suggestions.length ? [new MessageActionRow().addComponents(new SuggestionSelectMenu(this, tags, suggestions, user))] : []
                    };
                default:
                    return { embeds: [new ErrorEmbed(templateEmbed, details)], components: [] }
            }
        } else if (!('id' in data)) {
            return { embeds: [new ErrorEmbed(templateEmbed, 'This is a censored tag, which requires a Gold+ Account to view')], components: [] }
        }

        const postURL = `https://danbooru.donmai.us/posts/${data.id}`;
        return {
            embeds: [new ImageEmbed(templateEmbed, { imageURL: data.large_file_url, score: data.score, postURL: postURL, tags: tags })],
            components: [new MessageActionRow().addComponents([new ViewOnlineButton(postURL), new AgainButton(this, tags), new RecycleButton(this, tags, user)])],
            imageURL: data.large_file_url
        }
    }
}
