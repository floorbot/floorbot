import { AutocompleteInteraction, Interaction, InteractionReplyOptions } from 'discord.js';
import { Autocomplete } from '../../../lib/discord/handlers/interfaces/Autocomplete.js';
import { E621API, E621APIAuth } from '../../../lib/apis/e621/E621API.js';
import { BooruReplyBuilder } from '../BooruReplyBuilder.js';
import { E621CommandData } from './E621CommandData.js';
import { BooruHandler } from '../BooruHandler.js';

export class E621Handler extends BooruHandler implements Autocomplete {

    private readonly api: E621API;
    private readonly apiData = { apiName: 'e621', apiIcon: 'https://en.wikifur.com/w/images/d/dd/E621Logo.png' };

    constructor(auth: E621APIAuth) {
        super({ nsfw: true, data: E621CommandData });
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

    public async generateResponse(interaction: Interaction, tags: string = String()): Promise<InteractionReplyOptions> {
        const post = await this.api.random(tags);
        if (!('file' in post)) {
            const url404 = await this.api.get404();
            const autocomplete = await this.api.autocomplete(tags);
            const suggestions = autocomplete.slice(0, 25).map(tag => { return { name: tag.name, count: tag.post_count }; });
            return new BooruReplyBuilder(interaction, this.apiData).addSuggestionEmbed({ suggestions, tags, url404 });
        }
        const postURL = `https://e621.net/posts/${post.id}`;
        return new BooruReplyBuilder(interaction, this.apiData).addImageEmbed({ imageURL: post.file.url, score: post.score.total, postURL: postURL, tags: tags });
    }
}
