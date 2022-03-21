import { BooruSuggestionData } from '../../builders/BooruSelectMenuActionRowBuilder.js';
import { BooruErrorData, BooruPostData } from '../../builders/BooruReplyBuilder.js';
import { PregchanChatInputCommandData } from './PregchanChatInputCommandData.js';
import { PregchanAPI } from '../../../../lib/apis/pregchan/PregchanAPI.js';
import { BooruChatInputHandler } from '../../BooruChatInputHandler.js';
import { AutocompleteInteraction } from 'discord.js';
import { IAutocomplete } from 'discord.js-handlers';
import { Pool } from 'mariadb';

export class PregchanChatInputHandler extends BooruChatInputHandler implements IAutocomplete {

    private readonly api: PregchanAPI;

    constructor(pool: Pool) {
        super(pool, PregchanChatInputCommandData);
        this.api = new PregchanAPI();
    }

    public async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
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

    public override async fetchBooruData(query: string | null): Promise<BooruPostData | BooruSuggestionData | BooruErrorData> {
        const booru = {
            query: query,
            apiName: 'Pregchan',
            apiIconURL: 'https://pregchan.com/favicons/favicon.ico'
        };
        const post = await this.api.randomImage(query || '');
        if (!post) { return { ...booru, url404: null, suggestions: [] }; }
        return {
            ...booru,
            score: null,
            count: null,
            imageURL: post.imageURL,
            postURL: post.thread.url,
            tags_characters: [],
            tags_species: [],
            tags_general: []
        };
    }
}
