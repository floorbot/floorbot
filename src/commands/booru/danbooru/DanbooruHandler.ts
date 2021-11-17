import { AutocompleteInteraction, Interaction, InteractionReplyOptions, MessageActionRow } from 'discord.js';
import { Autocomplete } from '../../../discord/handler/interfaces/Autocomplete.js';
import { DanbooruCommandData } from './DanbooruCommandData.js';
import { BooruSelectMenu } from '../BooruSelectMenu.js';
import { DanbooruAPI } from './api/DanbooruAPI.js';
import { BooruHandler } from '../BooruHandler.js';
import { BooruButton } from '../BooruButton.js';
import { BooruEmbed } from '../BooruEmbed.js';
import { Redis } from 'ioredis';

export class DanbooruHandler extends BooruHandler implements Autocomplete {

    private readonly api: DanbooruAPI;

    constructor(redis: Redis, auth?: { username: string, apiKey: string }) {
        super({
            id: 'danbooru',
            nsfw: true,
            data: DanbooruCommandData,
            apiName: 'Danbooru',
            apiIcon: 'https://dl.airtable.com/.attachments/e0faba2e2b9f1cc1ad2b07b9ed6e63a3/9fdd81b5/512x512bb.jpg'
        });
        this.api = new DanbooruAPI({ redis, auth });
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
        const data = await this.api.random(tags);
        if ('success' in data && !data.success) {
            const details = data.message || 'The database timed out running your query.'
            switch (details) {
                case 'You cannot search for more than 2 tags at a time.':
                    return BooruEmbed.createTagLimitEmbed(this, interaction, 'basic', details.match(/\d+/)![1]!).toReplyOptions();
                case 'You cannot search for more than 6 tags at a time.':
                    return BooruEmbed.createTagLimitEmbed(this, interaction, 'gold', details.match(/\d+/)![1]!).toReplyOptions();
                case 'You cannot search for more than 12 tags at a time.':
                    return BooruEmbed.createTagLimitEmbed(this, interaction, 'platinum', details.match(/\d+/)![1]!).toReplyOptions();
                case 'The database timed out running your query.':
                    return BooruEmbed.createTimeoutEmbed(this, interaction, tags).toReplyOptions();
                case 'That record was not found.':
                    const url404 = await this.api.get404();
                    const autocomplete = await this.api.autocomplete(tags);
                    const suggestions = autocomplete.slice(0, 25).map(tag => { return { name: tag.value, count: tag.post_count } });
                    return {
                        embeds: [BooruEmbed.createSuggestionEmbed(this, interaction, { suggestions, tags, url404 })],
                        components: suggestions.length ? [BooruSelectMenu.createSuggestionSelectMenu({ tags, suggestions, url404 }).toActionRow()] : []
                    };
                default: throw { interaction, tags };
            }
        } else if (!('id' in data)) {
            return BooruEmbed.createRestrictedTagEmbed(this, interaction, tags).toReplyOptions();
        }
        const postURL = `https://danbooru.donmai.us/posts/${data.id}`;
        return {
            embeds: [BooruEmbed.createImageEmbed(this, interaction, { imageURL: data.large_file_url, score: data.score, postURL: postURL, tags: tags })],
            components: [new MessageActionRow().addComponents([
                BooruButton.createViewOnlineButton(postURL),
                BooruButton.createRepeatButton(tags),
                BooruButton.createRecycleButton()
            ])]
        }
    }
}
