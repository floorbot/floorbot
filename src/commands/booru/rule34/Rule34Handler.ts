import { AutocompleteInteraction, InteractionReplyOptions, MessageActionRow } from 'discord.js';
import { Autocomplete } from '../../../discord/interfaces/Autocomplete';
import { Rule34API, Rule34APIAutocomplete } from './Rule34API';
import { Rule34CommandData } from './Rule34CommandData';
import { HandlerContext } from '../../../discord/Util';
import { BooruSelectMenu } from '../BooruSelectMenu';
import { BooruHandler } from '../BooruHandler';
import { BooruButton } from '../BooruButton';
import { BooruEmbed } from '../BooruEmbed';

export class Rule34Handler extends BooruHandler implements Autocomplete {

    constructor() {
        super({
            id: 'rule34',
            nsfw: true,
            data: Rule34CommandData,
            apiName: 'Rule34',
            apiIcon: 'https://rule34.xxx/apple-touch-icon-precomposed.png'
        });
    }

    public async autocomplete(interaction: AutocompleteInteraction): Promise<any> {
        const partialTags = interaction.options.getString('tags', true);
        const tags = partialTags.split('+');
        const partial = tags.pop() as string;
        if (!partial.length) return interaction.respond([]);
        const autocomplete = await Rule34API.autocomplete(partial);
        const options = autocomplete.slice(0, 5).map(tag => {
            return {
                name: [...tags, tag.value].join('+'),
                value: [...tags, tag.value].join('+')
            }
        });
        return interaction.respond(options);
    }

    public async generateResponse(context: HandlerContext, tags: string = String()): Promise<InteractionReplyOptions> {
        const post = await Rule34API.random(tags);
        if (!post) {
            const url404 = await Rule34API.get404();
            const autocomplete = await Rule34API.autocomplete(tags);
            const suggestions = autocomplete.slice(0, 25).map((tag: Rule34APIAutocomplete) => { return { name: tag.value, count: tag.total } });
            return {
                embeds: [BooruEmbed.createSuggestionEmbed(this, context, { suggestions, tags, url404 })],
                components: suggestions.length ? [BooruSelectMenu.createSuggestionSelectMenu({ tags, suggestions, url404 }).toActionRow()] : []
            };
        }
        const postURL = `https://rule34.xxx/index.php?page=post&s=view&id=${post.id}`;
        return {
            embeds: [BooruEmbed.createImageEmbed(this, context, { imageURL: post.file_url, score: parseInt(post.score), postURL: postURL, tags: tags })],
            components: [new MessageActionRow().addComponents([
                BooruButton.createViewOnlineButton(postURL),
                BooruButton.createRepeatButton(tags),
                BooruButton.createRecycleButton()
            ])]
        }
    }
}
