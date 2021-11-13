import { Interaction, InteractionReplyOptions, MessageActionRow } from 'discord.js';
import { PregchanCommandData } from './PregchanCommandData.js';
import { BooruButton } from '../BooruButton.js';
import { BooruEmbed } from '../BooruEmbed.js';
import { BooruHandler } from '../BooruHandler.js';
import { PregchanAPI } from './PregchanAPI.js';

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

    public async generateResponse(interaction: Interaction, search: string = String()): Promise<InteractionReplyOptions> {
        const post = await PregchanAPI.random(search);
        if (!post) { return BooruEmbed.createSuggestionEmbed(this, interaction, { suggestions: [], tags: search, url404: null }).toReplyOptions() }
        return {
            embeds: [BooruEmbed.createImageEmbed(this, interaction, { imageURL: post.imageURL, score: null, postURL: post.thread.url, tags: search })],
            components: [new MessageActionRow().addComponents([
                BooruButton.createViewOnlineButton(post.thread.url),
                BooruButton.createRepeatButton(search),
                BooruButton.createRecycleButton()
            ])]
        }
    }
}
