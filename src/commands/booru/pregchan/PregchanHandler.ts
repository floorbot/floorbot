import { InteractionReplyOptions, MessageActionRow } from 'discord.js';
import { PregchanCommandData } from './PregchanCommandData';
import { HandlerContext } from '../../../discord/Util';
import { BooruButton } from '../BooruButton';
import { BooruEmbed } from '../BooruEmbed';
import { BooruHandler } from '../BooruHandler';
import { PregchanAPI } from './PregchanAPI';

export class PregchanHandler extends BooruHandler {

    constructor() {
        super({
            id: 'pregchan',
            nsfw: true,
            data: PregchanCommandData,
            apiName: 'Pregchan',
            apiIcon: 'https://pregchan.com/favicons/favicon.ico'
        });
    }

    public async generateResponse(context: HandlerContext, search: string = String()): Promise<InteractionReplyOptions> {
        const post = await PregchanAPI.random(search);
        if (!post) { return BooruEmbed.createSuggestionEmbed(this, context, { suggestions: [], tags: search, url404: null }).toReplyOptions() }
        return {
            embeds: [BooruEmbed.createImageEmbed(this, context, { imageURL: post.imageURL, score: null, postURL: post.thread.url, tags: search })],
            components: [new MessageActionRow().addComponents([
                BooruButton.createViewOnlineButton(post.thread.url),
                BooruButton.createRepeatButton(search),
                BooruButton.createRecycleButton(),
                // BooruButton.createDeleteButton()
            ])]
        }
    }
}
