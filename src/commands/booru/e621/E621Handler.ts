import { AutocompleteInteraction, Interaction, InteractionReplyOptions, MessageActionRow } from 'discord.js';
import { Autocomplete } from '../../../discord/handler/interfaces/Autocomplete';
import { BooruSelectMenu } from '../BooruSelectMenu';
import { E621CommandData } from './E621CommandData';
import { BooruHandler } from '../BooruHandler';
import { BooruButton } from '../BooruButton';
import { BooruEmbed } from '../BooruEmbed';
import { E621API } from './E621API';

export class E621Handler extends BooruHandler implements Autocomplete {

    constructor() {
        super({
            id: 'e621',
            nsfw: true,
            data: E621CommandData,
            apiName: 'e621',
            apiIcon: 'https://en.wikifur.com/w/images/d/dd/E621Logo.png'
        });
    }

    public async autocomplete(interaction: AutocompleteInteraction): Promise<any> {
        const partialTags = interaction.options.getString('tags', true);
        const tags = partialTags.split('+');
        const partial = tags.pop() as string;
        if (!partial.length) return interaction.respond([]);
        const autocomplete = await E621API.autocomplete(partial);
        const options = autocomplete.slice(0, 5).map(tag => {
            return {
                name: [...tags, tag.name].join('+'),
                value: [...tags, tag.name].join('+')
            }
        });
        return interaction.respond(options);
    }

    public async generateResponse(interaction: Interaction, tags: string = String()): Promise<InteractionReplyOptions> {
        const post = await E621API.random(tags);
        if (!('file' in post)) {
            const url404 = await E621API.get404();
            const autocomplete = await E621API.autocomplete(tags);
            const suggestions = autocomplete.slice(0, 25).map(tag => { return { name: tag.name, count: tag.post_count } });
            return {
                embeds: [BooruEmbed.createSuggestionEmbed(this, interaction, { suggestions, tags, url404 })],
                components: suggestions.length ? [BooruSelectMenu.createSuggestionSelectMenu({ tags, suggestions, url404 }).toActionRow()] : []
            };
        }
        const postURL = `https://e621.net/posts/${post.id}`;
        return {
            embeds: [BooruEmbed.createImageEmbed(this, interaction, { imageURL: post.file.url, score: post.score.total, postURL: postURL, tags: tags })],
            components: [new MessageActionRow().addComponents([
                BooruButton.createViewOnlineButton(postURL),
                BooruButton.createRepeatButton(tags),
                BooruButton.createRecycleButton()
            ])]
        }
    }
}
