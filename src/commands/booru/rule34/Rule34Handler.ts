import { AutocompleteInteraction, Interaction, InteractionReplyOptions } from 'discord.js';
import { Rule34API, Rule34APIAutocomplete } from '../../../apis/rule34/Rule34API.js';
import { Autocomplete } from '../../../discord/handlers/interfaces/Autocomplete.js';
import { Rule34CommandData } from './Rule34CommandData.js';
import { BooruHandler } from '../BooruHandler.js';
import { BooruReplies } from '../BooruReplies.js';

export class Rule34Handler extends BooruHandler implements Autocomplete {

    protected readonly replies: BooruReplies;
    private readonly api: Rule34API;

    constructor() {
        super({ nsfw: true, data: Rule34CommandData });
        this.replies = new BooruReplies({ apiName: 'Rule34', apiIcon: 'https://dl.airtable.com/.attachments/e0faba2e2b9f1cc1ad2b07b9ed6e63a3/9fdd81b5/512x512bb.jpg' });
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
            }
        });
        return interaction.respond(options);
    }

    public async generateResponse(interaction: Interaction, tags: string = String()): Promise<InteractionReplyOptions> {
        const post = await this.api.random(tags);
        if (!post) {
            const url404 = await this.api.get404();
            const autocomplete = await this.api.autocomplete(tags);
            const suggestions = autocomplete.slice(0, 25).map((tag: Rule34APIAutocomplete) => { return { name: tag.value, count: tag.total } });
            return this.replies.createSuggestionReply(interaction, { suggestions, tags, url404 });
        }
        const postURL = `https://rule34.xxx/index.php?page=post&s=view&id=${post.id}`;
        return this.replies.createImageReply(interaction, { imageURL: post.file_url, score: parseInt(post.score), postURL: postURL, tags: tags });
    }
}
