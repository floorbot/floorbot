import { BooruHandler, BooruHandlerReply } from '../../BooruHandler';
import { CommandClient, HandlerContext } from 'discord.js-commands';
import { E621CommandData } from './E621CommandData';
import { Message, MessageActionRow } from 'discord.js';
import { E621API } from './E621API';

import { SuggestionEmbed } from '../../message/embeds/SuggestionEmbed';
import { ImageEmbed } from '../../message/embeds/ImageEmbed';

import { ViewOnlineButton } from '../../message/buttons/ViewOnlineButton';
import { RecycleButton } from '../../message/buttons/RecycleButton';
import { AgainButton } from '../../message/buttons/AgainButton';

import { SuggestionSelectMenu } from '../../message/selectmenus/SuggestionSelectMenu';

export class E621Handler extends BooruHandler {

    constructor(client: CommandClient) {
        super(client, {
            id: 'e621',
            name: 'E621',
            nsfw: true
        }, E621CommandData);
    }

    public getEmbedTemplate(context: HandlerContext) {
        return super.getEmbedTemplate(context)
            .setFooter('Powered by E621', 'https://en.wikifur.com/w/images/d/dd/E621Logo.png');
    }

    public async generateResponse(context: HandlerContext, tags: string = String()): Promise<BooruHandlerReply> {
        const user = context instanceof Message ? context.author : context.user;
        const templateEmbed = this.getEmbedTemplate(context);
        const post = await E621API.random(tags);
        if (!('file' in post)) {
            const url404 = await E621API.get404();
            const autocomplete = await E621API.autocomplete(tags);
            const suggestions = autocomplete.slice(0, 25).map(tag => { return { name: tag.name, count: tag.post_count } });
            return {
                embeds: [new SuggestionEmbed(templateEmbed, { suggestions, tags, url404 })],
                components: suggestions.length ? [new MessageActionRow().addComponents(new SuggestionSelectMenu(this, tags, suggestions, user))] : []
            };
        }
        const postURL = `https://e621.net/posts/${post.id}`;
        return {
            embeds: [new ImageEmbed(templateEmbed, { imageURL: post.file.url, score: post.score.total, postURL: postURL, tags: tags })],
            components: [new MessageActionRow().addComponents([new ViewOnlineButton(postURL), new AgainButton(this, tags), new RecycleButton(this, tags, user)])],
            imageURL: post.file.url
        }
    }
}
