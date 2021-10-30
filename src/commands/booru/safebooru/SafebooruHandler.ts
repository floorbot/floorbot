import { AutocompleteInteraction, InteractionReplyOptions, MessageActionRow, Util } from 'discord.js';
import { SafebooruCommandData } from './SafebooruCommandData';
import { HandlerContext } from '../../../discord/Util';
import { BooruSelectMenu } from '../BooruSelectMenu';
import { BooruHandler } from '../BooruHandler';
import { BooruButton } from '../BooruButton';
import { SafebooruAPI } from './SafebooruAPI';
import { BooruEmbed } from '../BooruEmbed';

export class SafebooruHandler extends BooruHandler {

    constructor() {
        super({
            id: 'safebooru',
            nsfw: false,
            data: SafebooruCommandData,
            apiName: 'Safebooru',
            apiIcon: 'https://dl.airtable.com/.attachments/e0faba2e2b9f1cc1ad2b07b9ed6e63a3/9fdd81b5/512x512bb.jpg'
        });
    }

    public override async autocomplete(interaction: AutocompleteInteraction): Promise<any> {
        const partial = interaction.options.getString('tags', true);
        const autocomplete = await SafebooruAPI.autocomplete(partial);
        const options = autocomplete.slice(0, 5).map(tag => {
            return {
                name: `${tag.label} [${Util.formatCommas(tag.post_count)} posts]`,
                value: tag.value
            }
        });
        return interaction.respond(options);
    }

    public async generateResponse(context: HandlerContext, tags: string = String()): Promise<InteractionReplyOptions> {
        const data = await SafebooruAPI.random(tags);
        if ('success' in data && !data.success) {
            const details = data.message || 'The database timed out running your query.'
            switch (details) {
                case 'You cannot search for more than 2 tags at a time.':
                    return BooruEmbed.createTagLimitEmbed(this, context, 'basic', details.match(/\d+/)![1]!).toReplyOptions();
                case 'You cannot search for more than 6 tags at a time.':
                    return BooruEmbed.createTagLimitEmbed(this, context, 'gold', details.match(/\d+/)![1]!).toReplyOptions();
                case 'You cannot search for more than 12 tags at a time.':
                    return BooruEmbed.createTagLimitEmbed(this, context, 'platinum', details.match(/\d+/)![1]!).toReplyOptions();
                case 'The database timed out running your query.':
                    return BooruEmbed.createTimeoutEmbed(this, context, tags).toReplyOptions();
                case 'That record was not found.':
                    const url404 = await SafebooruAPI.get404();
                    const autocomplete = await SafebooruAPI.autocomplete(tags);
                    const suggestions = autocomplete.slice(0, 25).map(tag => { return { name: tag.value, count: tag.post_count } });
                    return {
                        embeds: [BooruEmbed.createSuggestionEmbed(this, context, { suggestions, tags, url404 })],
                        components: suggestions.length ? [BooruSelectMenu.createSuggestionSelectMenu({ tags, suggestions, url404 }).toActionRow()] : []
                    };
                default: throw { context, tags };
            }
        } else if (!('id' in data)) {
            return BooruEmbed.createRestrictedTagEmbed(this, context, tags).toReplyOptions();
        }
        const postURL = `https://safebooru.donmai.us/posts/${data.id}`;
        return {
            embeds: [BooruEmbed.createImageEmbed(this, context, { imageURL: data.large_file_url, score: data.score, postURL: postURL, tags: tags })],
            components: [new MessageActionRow().addComponents([
                BooruButton.createViewOnlineButton(postURL),
                BooruButton.createRepeatButton(tags),
                BooruButton.createRecycleButton()
            ])]
        }
    }
}
