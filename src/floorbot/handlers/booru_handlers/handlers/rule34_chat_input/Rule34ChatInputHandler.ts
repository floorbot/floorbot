import { Rule34API, Rule34APIAutocomplete } from '../../../../../lib/apis/rule34/Rule34API.js';
import { BooruSuggestionData } from '../../builders/BooruSelectMenuActionRowBuilder.js';
import { BooruErrorData, BooruPostData } from '../../builders/BooruReplyBuilder.js';
import { Rule34ChatInputCommandData } from './Rule34ChatInputCommandData.js';
import { BooruChatInputHandler } from '../../BooruChatInputHandler.js';
import { AutocompleteInteraction } from 'discord.js';
import { IAutocomplete } from 'discord.js-handlers';
import { Pool } from 'mariadb';

export class Rule34ChatInputHandler extends BooruChatInputHandler implements IAutocomplete {

    private readonly api: Rule34API;

    constructor(pool: Pool) {
        super(pool, Rule34ChatInputCommandData);
        this.api = new Rule34API();
    }

    public async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
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

    public override async fetchBooruData(query: string | null): Promise<BooruPostData | BooruSuggestionData | BooruErrorData> {
        const booru = {
            query: query,
            apiName: 'Rule34',
            apiIconURL: 'https://rule34.xxx/apple-touch-icon-precomposed.png'
        };
        const post = await this.api.random(query);
        if (!post) {
            const url404 = await this.api.get404();
            const autocomplete = await this.api.autocomplete(query);
            const suggestions = autocomplete.slice(0, 25).map((tag: Rule34APIAutocomplete) => { return { name: tag.value, count: tag.total }; });
            return { ...booru, url404: url404, suggestions: suggestions };
        }
        const totalHearts = post.file_url ? await this.booruTable.selectCount('image_url', { image_url: post.file_url }) : null;
        return {
            ...booru,
            totalHearts: totalHearts ? Number(totalHearts.count) : 0,
            score: parseInt(post.score),
            count: post.count.total,
            imageURL: post.file_url,
            postURL: `https://rule34.xxx/index.php?page=post&s=view&id=${post.id}`,
            tags_characters: [],
            tags_species: [],
            tags_general: post.tags.split(' ').filter(tag => tag.length)
        };
    }
}
