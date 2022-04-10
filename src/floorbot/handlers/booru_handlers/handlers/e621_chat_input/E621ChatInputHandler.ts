import { E621API, E621APIAuth, E621APIAutocomplete } from '../../../../../lib/apis/e621/E621API.js';
import { BooruSuggestionData } from '../../builders/BooruSelectMenuActionRowBuilder.js';
import { BooruErrorData, BooruPostData } from '../../builders/BooruReplyBuilder.js';
import { E621ChatInputCommandData } from './E621ChatInputCommandData.js';
import { BooruChatInputHandler } from '../../BooruChatInputHandler.js';
import { AutocompleteInteraction } from 'discord.js';
import { IAutocomplete } from 'discord.js-handlers';
import { Pool } from 'mariadb';

export class E621ChatInputHandler extends BooruChatInputHandler implements IAutocomplete {

    private readonly api: E621API;

    constructor(pool: Pool, auth: E621APIAuth) {
        super(pool, E621ChatInputCommandData);
        this.api = new E621API(auth);
    }

    public async autocomplete(interaction: AutocompleteInteraction): Promise<any> {
        const partialTags = interaction.options.getString('tags', true);
        const tags = partialTags.split('+');
        const partial = tags.pop() as string;
        if (!partial.length) return interaction.respond([]);
        const autocomplete = await this.api.autocomplete(partial) as E621APIAutocomplete[];
        if (E621API.isError(autocomplete)) return interaction.respond([]);
        const options = autocomplete.slice(0, 5).map(tag => {
            return {
                name: [...tags, tag.name].join('+'),
                value: [...tags, tag.name].join('+')
            };
        });
        return interaction.respond(options);
    }

    public override async fetchBooruData(query: string | null): Promise<BooruPostData | BooruSuggestionData | BooruErrorData> {
        const booru = { query: query, apiName: 'E621', apiIconURL: 'https://en.wikifur.com/w/images/d/dd/E621Logo.png' };
        const post = await this.api.random(query);
        if (E621API.isError(post)) {
            const url404 = await this.api.get404();
            const autocomplete = await this.api.autocomplete(query);
            const suggestions = E621API.isError(autocomplete) ? [] : autocomplete.slice(0, 25).map(tag => { return { name: tag.name, count: tag.post_count }; });
            return { ...booru, url404: url404, suggestions: suggestions };
        }
        const totalHearts = post.file.url ? await this.booruTable.selectCount('image_url', { image_url: post.file.url }) : null;
        return {
            ...booru,
            totalHearts: totalHearts ? Number(totalHearts.count) : 0,
            score: post.score.total,
            count: null,
            imageURL: post.file.url,
            postURL: `https://e621.net/posts/${post.id}`,
            tags_characters: post.tags.character,
            tags_species: post.tags.species,
            tags_general: post.tags.general
        };
    }
}
