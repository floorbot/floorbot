import { AutocompleteInteraction, Interaction, InteractionReplyOptions } from 'discord.js';
import { Autocomplete } from '../../../lib/discord/handlers/interfaces/Autocomplete.js';
import { DonmaiAPI, DonmaiAPIAuth } from '../../../lib/apis/donmai/DonmaiAPI.js';
import { DonmaiCommandData } from './DonmaiCommandData.js';
import { DonmaiReplyBuilder } from './DonmaiReplyBuilder.js';
import { BooruHandler } from '../BooruHandler.js';

export class DonmaiHandler extends BooruHandler implements Autocomplete {

    private readonly api: DonmaiAPI;

    constructor(options: { subDomain: string, auth?: DonmaiAPIAuth, nsfw: boolean; }) {
        const { subDomain, auth, nsfw } = options;
        super({ nsfw: nsfw, data: DonmaiCommandData.create(subDomain) });
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
                    return new DonmaiReplyBuilder(interaction, this.api.subDomain).addDonmaiTagLimitEmbed('basic', details.match(/\d+/)![1]!);
                case 'You cannot search for more than 6 tags at a time.':
                    return new DonmaiReplyBuilder(interaction, this.api.subDomain).addDonmaiTagLimitEmbed('gold', details.match(/\d+/)![1]!);
                case 'You cannot search for more than 12 tags at a time.':
                    return new DonmaiReplyBuilder(interaction, this.api.subDomain).addDonmaiTagLimitEmbed('platinum', details.match(/\d+/)![1]!);
                case 'The database timed out running your query.':
                    return new DonmaiReplyBuilder(interaction, this.api.subDomain).addDonmaiTimeoutEmbed(tags);
                case 'That record was not found.':
                    const url404 = await this.api.get404();
                    const autocomplete = await this.api.autocomplete(tags);
                    const suggestions = autocomplete.slice(0, 25).map(tag => { return { name: tag.value, count: tag.post_count }; });
                    return new DonmaiReplyBuilder(interaction, this.api.subDomain).addSuggestionEmbed({ suggestions, tags, url404 });
                default: {
                    console.warn(`[${this.api.subDomain}] Unknown api response details <${details}>`);
                    return new DonmaiReplyBuilder(interaction, this.api.subDomain).addDonmaiUnknownDetailsEmbed(tags, details);
                }
            }
        } else if (!('id' in data)) {
            return new DonmaiReplyBuilder(interaction, this.api.subDomain).addDonmaiRestrictedTagEmbed(tags);
        }
        const postURL = `https://${this.api.subDomain}.donmai.us/posts/${data.id}`;
        return new DonmaiReplyBuilder(interaction, this.api.subDomain).addImageEmbed({ imageURL: data.large_file_url, score: data.score, postURL: postURL, tags: tags });
    }
}
