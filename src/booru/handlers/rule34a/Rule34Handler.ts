import { BooruHandler, BooruHandlerReply } from '../../BooruHandler';
import { CommandClient, HandlerContext } from 'discord.js-commands';
import { Rule34CommandData } from './Rule34CommandData';
import { Message, MessageActionRow } from 'discord.js';
import { Rule34API, Rule34APIAutocomplete } from './Rule34API';

import { SuggestionEmbed } from '../../message/embeds/SuggestionEmbed';
import { ImageEmbed } from '../../message/embeds/ImageEmbed';

import { ViewOnlineButton } from '../../message/buttons/ViewOnlineButton';
import { RecycleButton } from '../../message/buttons/RecycleButton';
import { AgainButton } from '../../message/buttons/AgainButton';

import { SuggestionSelectMenu } from '../../message/selectmenus/SuggestionSelectMenu';

export class Rule34Handler extends BooruHandler {

    constructor(client: CommandClient) {
        super(client, {
            id: 'rule34',
            name: 'Rule34',
            nsfw: true
        }, Rule34CommandData);
    }

    public getEmbedTemplate(context: HandlerContext) {
        return super.getEmbedTemplate(context)
            .setFooter('Powered by Rule34', 'https://rule34.xxx/apple-touch-icon-precomposed.png');
    }

    public async generateResponse(context: HandlerContext, tags: string = String()): Promise<BooruHandlerReply> {
        const user = context instanceof Message ? context.author : context.user;
        const templateEmbed = this.getEmbedTemplate(context);
        const post = await Rule34API.random(tags);
        if (!post) {
            const url404 = await Rule34API.get404();
            const autocomplete = await Rule34API.autocomplete(tags);
            const suggestions = autocomplete.slice(0, 25).map((tag: Rule34APIAutocomplete) => { return { name: tag.value, count: tag.total } });
            return {
                embeds: [new SuggestionEmbed(templateEmbed, { suggestions, tags, url404 })],
                components: suggestions.length ? [new MessageActionRow().addComponents(new SuggestionSelectMenu(this, tags, suggestions, user))] : []
            };
        }
        const postURL = `https://rule34.xxx/index.php?page=post&s=view&id=${post.id}`;
        return {
            embeds: [new ImageEmbed(templateEmbed, { imageURL: post.file_url, score: parseInt(post.score), postURL: postURL, tags: tags })],
            components: [new MessageActionRow().addComponents([new ViewOnlineButton(postURL), new AgainButton(this, tags), new RecycleButton(this, tags, user)])],
            imageURL: post.file_url
        }
    }
}
