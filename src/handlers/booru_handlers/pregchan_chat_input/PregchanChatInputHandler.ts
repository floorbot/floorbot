import { AutocompleteInteraction, Interaction, InteractionReplyOptions } from 'discord.js';
import { PregchanChatInputCommandData } from './PregchanChatInputCommandData.js';
import { PregchanAPI } from '../../../lib/apis/pregchan/PregchanAPI.js';
import { BooruChatInputHandler } from '../BooruChatInputHandler.js';
import { PregchanReplyBuilder } from './PregchanReplyBuilder.js';
import { BooruPostData } from '../BooruReplyBuilder.js';
import { IAutocomplete } from 'discord.js-handlers';

export class PregchanChatInputHandler extends BooruChatInputHandler implements IAutocomplete {

    private readonly api: PregchanAPI;

    constructor() {
        super({ nsfw: true, data: PregchanChatInputCommandData });
        this.api = new PregchanAPI();
    }

    public async autocomplete(interaction: AutocompleteInteraction): Promise<any> {
        const partialThread = interaction.options.getString('thread', true);
        const threads = await this.api.searchThreads(partialThread);
        const options = threads.slice(0, 5).map(thread => {
            return {
                name: thread.name,
                value: thread.id
            };
        });
        return interaction.respond(options);
    }

    public async fetchPostData(query: string): Promise<BooruPostData | string | null> {
        const post = await this.api.randomImage(query);
        if (!post) return null;
        return {
            imageURL: post.imageURL,
            score: null,
            postURL: post.thread.url,
            tags: []
        };
    }

    public async createImageReply(source: Interaction, query: string, postData: BooruPostData | string | null): Promise<InteractionReplyOptions> {
        if (!postData || typeof postData === 'string') {
            return new PregchanReplyBuilder(source)
                .addSuggestionEmbed(query, []);
        }
        return new PregchanReplyBuilder(source)
            .addImageEmbed(postData, query)
            .addImageActionRow(postData, query);
    }

    public async createTagsReply(source: Interaction, query: string, postData: BooruPostData | string | null): Promise<InteractionReplyOptions> {
        if (!postData || typeof postData === 'string') return this.createImageReply(source, query, postData);
        return new PregchanReplyBuilder(source)
            .addTagsEmbed(postData, query)
            .addTagsActionRow(postData, query);
    }
}
