import { AutocompleteInteraction, Interaction, InteractionReplyOptions } from 'discord.js';
import { Autocomplete } from '../../../lib/discord/handlers/interfaces/Autocomplete.js';
import { DonmaiAPI, DonmaiAPIAuth } from '../../../lib/apis/donmai/DonmaiAPI.js';
import { DonmaiCommandData } from './DonmaiCommandData.js';
import { DonmaiReplies } from './DonmaiReplies.js';
import { BooruHandler } from '../BooruHandler.js';

export class DonmaiHandler extends BooruHandler implements Autocomplete {

    protected readonly replies: DonmaiReplies;
    private readonly api: DonmaiAPI;

    constructor(options: { subDomain: string, auth?: DonmaiAPIAuth, nsfw: boolean; }) {
        const { subDomain, auth, nsfw } = options;
        super({ nsfw: nsfw, data: DonmaiCommandData.create(subDomain) });
        this.replies = new DonmaiReplies(subDomain);
        this.api = new DonmaiAPI(subDomain, auth);
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

    public async generateResponse(interaction: Interaction, tags: string = String()): Promise<InteractionReplyOptions> {
        const data = await this.api.random(tags);
        if ('success' in data && !data.success) {
            const details = data.message || 'The database timed out running your query.';
            switch (details) {
                case 'You cannot search for more than 2 tags at a time.':
                    return this.replies.createTagLimitReply(interaction, 'basic', details.match(/\d+/)![1]!);
                case 'You cannot search for more than 6 tags at a time.':
                    return this.replies.createTagLimitReply(interaction, 'gold', details.match(/\d+/)![1]!);
                case 'You cannot search for more than 12 tags at a time.':
                    return this.replies.createTagLimitReply(interaction, 'platinum', details.match(/\d+/)![1]!);
                case 'The database timed out running your query.':
                    return this.replies.createTimeoutReply(interaction, tags);
                case 'That record was not found.':
                    const url404 = await this.api.get404();
                    const autocomplete = await this.api.autocomplete(tags);
                    const suggestions = autocomplete.slice(0, 25).map(tag => { return { name: tag.value, count: tag.post_count }; });
                    return this.replies.createSuggestionReply(interaction, { suggestions, tags, url404 });
                default: {
                    console.warn(`[${this.api.subDomain}] Unknown api response details <${details}>`);
                    return this.replies.createUnknownDetailsReply(interaction, tags, details);
                }
            }
        } else if (!('id' in data)) {
            return this.replies.createRestrictedTagReply(interaction, tags);
        }
        const postURL = `https://${this.api.subDomain}.donmai.us/posts/${data.id}`;
        return this.replies.createImageReply(interaction, { imageURL: data.large_file_url, score: data.score, postURL: postURL, tags: tags });
    }
}
