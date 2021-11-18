import { AutocompleteInteraction, Interaction, InteractionReplyOptions } from 'discord.js';
import { Autocomplete } from '../../../discord/handler/interfaces/Autocomplete.js';
import { E621CommandData } from './E621CommandData.js';
import { BooruHandler } from '../BooruHandler.js';
import { BooruReplies } from '../BooruReplies.js';
import { E621API } from './api/E621API.js';
import { Redis } from 'ioredis';

export class E621Handler extends BooruHandler implements Autocomplete {

    protected readonly replies: BooruReplies;
    private readonly api: E621API;

    constructor(redis: Redis, auth: { username: string, apiKey: string, userAgent: string }) {
        super({ nsfw: true, data: E621CommandData });
        this.replies = new BooruReplies({ apiName: 'e621', apiIcon: 'https://en.wikifur.com/w/images/d/dd/E621Logo.png' });
        this.api = new E621API({ redis, auth });
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
            }
        });
        return interaction.respond(options);
    }

    public async generateResponse(interaction: Interaction, tags: string = String()): Promise<InteractionReplyOptions> {
        const post = await this.api.random(tags);
        if (!('file' in post)) {
            const url404 = await this.api.get404();
            const autocomplete = await this.api.autocomplete(tags);
            const suggestions = autocomplete.slice(0, 25).map(tag => { return { name: tag.name, count: tag.post_count } });
            return this.replies.createSuggestionReply(interaction, { suggestions, tags, url404 });
        }
        const postURL = `https://e621.net/posts/${post.id}`;
        return this.replies.createImageReply(interaction, { imageURL: post.file.url, score: post.score.total, postURL: postURL, tags: tags });
    }
}
