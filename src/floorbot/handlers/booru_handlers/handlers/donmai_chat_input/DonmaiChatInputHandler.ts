import { BooruSuggestionData } from '../../builders/BooruSelectMenuActionRowBuilder.js';
import { DonmaiAPI, DonmaiAPIAuth } from '../../../../../lib/apis/donmai/DonmaiAPI.js';
import { BooruErrorData, BooruPostData } from '../../builders/BooruReplyBuilder.js';
import { DonmaiChatInputCommandData } from './DonmaiChatInputCommandData.js';
import { BooruChatInputHandler } from '../../BooruChatInputHandler.js';
import { DiscordUtil } from '../../../../../lib/discord/DiscordUtil.js';
import { AutocompleteInteraction } from 'discord.js';
import { IAutocomplete } from 'discord.js-handlers';
import { Pool } from 'mariadb';

export class DonmaiChatInputHandler extends BooruChatInputHandler implements IAutocomplete {

    private readonly api: DonmaiAPI;

    constructor(pool: Pool, options: { subDomain: string, auth?: DonmaiAPIAuth, nsfw: boolean; }) {
        const { subDomain, auth } = options;
        super(pool, DonmaiChatInputCommandData.create(subDomain));
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

    public override async fetchBooruData(query: string | null): Promise<BooruPostData | BooruSuggestionData | BooruErrorData> {
        const booru = {
            query: query,
            apiName: DiscordUtil.capitalizeString(this.api.subDomain),
            apiIconURL: 'https://dl.airtable.com/.attachments/e0faba2e2b9f1cc1ad2b07b9ed6e63a3/9fdd81b5/512x512bb.jpg'
        };
        const post = await this.api.random(query);
        const count = await this.api.count(query);
        if (DonmaiAPI.isError(post)) {
            if (!post.message) return { ...booru, error: 'The database timed out running your query.' };
            switch (post.message) {
                case 'You cannot search for more than 2 tags at a time.': return { ...booru, error: `Sorry! You can only search up to \`2\` tags with a \`basic\` account 😦` };
                case 'You cannot search for more than 6 tags at a time.': return { ...booru, error: `Sorry! You can only search up to \`6\` tags with a \`gold\` account 😦` };
                case 'You cannot search for more than 12 tags at a time.': return { ...booru, error: `Sorry! You can only search up to \`12\` tags with a \`platinum\` account 😦` };
                case 'The database timed out running your query.': return { ...booru, error: post.message };
                case 'That record was not found.':
                    const url404 = await this.api.get404();
                    const autocomplete = await this.api.autocomplete(query);
                    const suggestions = autocomplete.slice(0, 25).map(tag => { return { name: tag.value, count: tag.post_count }; });
                    return { ...booru, url404: url404, suggestions: suggestions };
                default: {
                    console.warn(`[support](${this.api.subDomain}) Unknown api response details <${post.message}>`);
                    return { ...booru, error: post.message };
                }
            }
        }
        const totalHearts = post.large_file_url ? await this.booruTable.selectCount('image_url', { image_url: post.large_file_url }) : null;
        return {
            ...booru,
            totalHearts: totalHearts ? Number(totalHearts.count) : 0,
            score: post.score,
            count: DonmaiAPI.isError(count) ? null : count.counts.posts,
            imageURL: post.large_file_url,
            postURL: `https://${this.api.subDomain}.donmai.us/posts/${post.id}`,
            tags_characters: post.tag_string_character.split(' ').filter(tag => tag.length),
            tags_species: [],
            tags_general: post.tag_string_general.split(' ').filter(tag => tag.length)
        };
    }
}
