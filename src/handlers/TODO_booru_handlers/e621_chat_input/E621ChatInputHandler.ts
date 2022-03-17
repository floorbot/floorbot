import { ResponseOptions } from '../../../lib/discord/builders/ReplyBuilder.js';
import { E621API, E621APIAuth } from '../../../lib/apis/e621/E621API.js';
import { E621ChatInputCommandData } from './E621ChatInputCommandData.js';
import { BooruChatInputHandler } from '../BooruChatInputHandler.js';
import { AutocompleteInteraction, Interaction } from 'discord.js';
import { E621ReplyBuilder } from './E621ReplyBuilder.js';
import { BooruPostData } from '../BooruReplyBuilder.js';
import { IAutocomplete } from 'discord.js-handlers';

export class E621ChatInputHandler extends BooruChatInputHandler implements IAutocomplete {

    private readonly api: E621API;

    constructor(auth: E621APIAuth) {
        super({ nsfw: true, data: E621ChatInputCommandData });
        this.api = new E621API(auth);
    }

    public async autocomplete(interaction: AutocompleteInteraction): Promise<any> {
        const partialTags = interaction.options.getString('tags', true);
        const tags = partialTags.split('+');
        const partial = tags.pop() as string;
        if (!partial.length) return interaction.respond([]);
        const autocomplete = await this.api.autocomplete(partial);
        const options = autocomplete.slice(0, 5).map(tag => {
            return {
                name: [...tags, tag.name].join('+'),
                value: [...tags, tag.name].join('+')
            };
        });
        return interaction.respond(options);
    }

    public async fetchPostData(query: string): Promise<BooruPostData | string | null> {
        const post = await this.api.random(query);
        if (!('file' in post)) return null;
        return {
            imageURL: post.file.url,
            score: post.score.total,
            postURL: `https://e621.net/posts/${post.id}`,
            tags: post.tags.general
        };
    }

    public async createImageReply(source: Interaction, query: string, postData: BooruPostData | string | null): Promise<ResponseOptions> {
        if (!postData || typeof postData === 'string') {
            const url404 = await this.api.get404();
            const autocomplete = await this.api.autocomplete(query);
            const suggestions = autocomplete.slice(0, 25).map(tag => { return { name: tag.name, count: tag.post_count }; });
            return new E621ReplyBuilder(source).addSuggestionEmbed(query, suggestions, url404);
        }
        return new E621ReplyBuilder(source)
            .addImageEmbed(postData, query)
            .addImageActionRow(postData, query);
    }

    public async createTagsReply(source: Interaction, query: string, postData: BooruPostData | string | null): Promise<ResponseOptions> {
        if (!postData || typeof postData === 'string') return this.createImageReply(source, query, postData);
        return new E621ReplyBuilder(source)
            .addTagsEmbed(postData, query)
            .addTagsActionRow(postData, query);
    }
}
