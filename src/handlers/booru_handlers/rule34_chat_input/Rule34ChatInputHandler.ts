import { AutocompleteInteraction, Interaction, InteractionReplyOptions } from 'discord.js';
import { Rule34API, Rule34APIAutocomplete } from '../../../lib/apis/rule34/Rule34API.js';
import { Rule34ChatInputCommandData } from './Rule34ChatInputCommandData.js';
import { BooruChatInputHandler } from '../BooruChatInputHandler.js';
import { Rule34ReplyBuilder } from './Rule34ReplyBuilder.js';
import { BooruPostData } from '../BooruReplyBuilder.js';
import { IAutocomplete } from 'discord.js-handlers';

export class Rule34ChatInputHandler extends BooruChatInputHandler implements IAutocomplete {

    private readonly api: Rule34API;

    constructor() {
        super({ nsfw: true, data: Rule34ChatInputCommandData });
        this.api = new Rule34API();
    }

    public async autocomplete(interaction: AutocompleteInteraction): Promise<any> {
        const partialTags = interaction.options.getString('tags', true);
        const tags = partialTags.split('+');
        const partial = tags.pop() as string;
        if (!partial.length) return interaction.respond([]);
        const autocomplete = await this.api.autocomplete(partial);
        const options = autocomplete.slice(0, 5).map(tag => {
            return {
                name: [...tags, tag.value].join('+'),
                value: [...tags, tag.value].join('+')
            };
        });
        return interaction.respond(options);
    }

    public async fetchPostData(query: string): Promise<BooruPostData | null> {
        const post = await this.api.random(query);
        if (!post) return null;
        return {
            imageURL: post.file_url,
            score: parseInt(post.score),
            tags: post.tags.split(' ').filter(tag => tag.length),
            postURL: `https://rule34.xxx/index.php?page=post&s=view&id=${post.id}`
        };
    }

    public async createImageReply(source: Interaction, query: string, postData: BooruPostData | null): Promise<InteractionReplyOptions> {
        if (!postData) {
            const url404 = await this.api.get404();
            const autocomplete = await this.api.autocomplete(query);
            const suggestions = autocomplete.slice(0, 25).map((tag: Rule34APIAutocomplete) => { return { name: tag.value, count: tag.total }; });
            return new Rule34ReplyBuilder(source).addSuggestionEmbed(query, suggestions, url404);
        }
        return new Rule34ReplyBuilder(source)
            .addImageEmbed(postData, query)
            .addImageActionRow(postData, query);
    }

    public async createTagsReply(source: Interaction, query: string, postData: BooruPostData | null): Promise<InteractionReplyOptions> {
        if (!postData) return this.createImageReply(source, query, postData);
        return new Rule34ReplyBuilder(source)
            .addTagsEmbed(postData, query)
            .addTagsActionRow(postData, query);
    }
}
