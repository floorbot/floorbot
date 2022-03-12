import { AutocompleteInteraction, Interaction, InteractionReplyOptions } from 'discord.js';
import { DonmaiAPI, DonmaiAPIAuth } from '../../../lib/apis/donmai/DonmaiAPI.js';
import { DonmaiChatInputCommandData } from './DonmaiChatInputCommandData.js';
import { BooruChatInputHandler } from '../BooruChatInputHandler.js';
import { DonmaiReplyBuilder } from './DonmaiReplyBuilder.js';
import { BooruPostData } from '../BooruReplyBuilder.js';
import { IAutocomplete } from 'discord.js-handlers';

export class DonmaiChatInputHandler extends BooruChatInputHandler implements IAutocomplete {

    private readonly api: DonmaiAPI;

    constructor(options: { subDomain: string, auth?: DonmaiAPIAuth, nsfw: boolean; }) {
        const { subDomain, auth, nsfw } = options;
        super({ nsfw: nsfw, data: DonmaiChatInputCommandData.create(subDomain) });
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

    public async fetchPostData(query: string): Promise<BooruPostData | null | string> {
        const post = await this.api.random(query);
        if ('success' in post && !post.success) return post.message || 'The database timed out running your query.';
        if (!('id' in post)) return null;
        return {
            imageURL: post.large_file_url,
            score: post.score,
            postURL: `https://${this.api.subDomain}.donmai.us/posts/${post.id}`,
            tags: post.tag_string_general.split(' ')
        };
    }

    public async createImageReply(source: Interaction, query: string, postData: BooruPostData | string | null): Promise<InteractionReplyOptions> {
        if (!postData) {
            return new DonmaiReplyBuilder(source).addDonmaiRestrictedTagEmbed(query);
        } else if (typeof postData === 'string') {
            switch (postData) {
                case 'You cannot search for more than 2 tags at a time.':
                    return new DonmaiReplyBuilder(source).addDonmaiTagLimitEmbed('basic', postData.match(/\d+/)![1]!);
                case 'You cannot search for more than 6 tags at a time.':
                    return new DonmaiReplyBuilder(source).addDonmaiTagLimitEmbed('gold', postData.match(/\d+/)![1]!);
                case 'You cannot search for more than 12 tags at a time.':
                    return new DonmaiReplyBuilder(source).addDonmaiTagLimitEmbed('platinum', postData.match(/\d+/)![1]!);
                case 'The database timed out running your query.':
                    return new DonmaiReplyBuilder(source).addDonmaiTimeoutEmbed(query);
                case 'That record was not found.':
                    const url404 = await this.api.get404();
                    const autocomplete = await this.api.autocomplete(query);
                    const suggestions = autocomplete.slice(0, 25).map(tag => { return { name: tag.value, count: tag.post_count }; });
                    return new DonmaiReplyBuilder(source).addSuggestionEmbed(query, suggestions, url404);
                default: {
                    console.warn(`[${this.api.subDomain}] Unknown api response details <${postData}>`);
                    return new DonmaiReplyBuilder(source).addDonmaiUnknownDetailsEmbed(query, postData);
                }
            }
        }
        return new DonmaiReplyBuilder(source)
            .addImageEmbed(postData, query)
            .addImageActionRow(postData, query);
    }

    public async createTagsReply(source: Interaction, query: string, postData: BooruPostData | string | null): Promise<InteractionReplyOptions> {
        if (!postData || typeof postData === 'string') return this.createImageReply(source, query, postData);
        return new DonmaiReplyBuilder(source)
            .addTagsEmbed(postData, query)
            .addTagsActionRow(postData, query);
    }
}
