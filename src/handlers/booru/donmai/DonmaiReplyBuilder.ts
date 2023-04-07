import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { HandlerContext } from 'discord.js-handlers';
import { DonmaiAPI, DonmaiAPIAutocomplete, DonmaiAPICount, DonmaiAPIPost, DonmaiAPISubDomain } from '../../../api/apis/donmai/DonmaiAPI.js';
import { Util } from '../../../core/Util.js';
import { ReplyBuilder } from '../../../core/builders/ReplyBuilder.js';
import { BooruPostData } from '../../../core/builders/booru/BooruReplyBuilder.js';

export class DonmaiReplyBuilder extends ReplyBuilder {

    private readonly api: DonmaiAPI;

    constructor(api: DonmaiAPI, context?: HandlerContext) {
        super(context);
        this.api = api;
    }

    protected static transformPost(post: DonmaiAPIPost, count: DonmaiAPICount, subDomain: DonmaiAPISubDomain): BooruPostData {
        return {
            score: post.score,
            count: count.counts.posts,
            imageURL: post.large_file_url,
            postURL: `https://${subDomain}.donmai.us/posts/${post.id}`,
            tags_characters: post.tag_string_character.split(' ').filter(tag => tag.length),
            tags_species: [],
            tags_general: post.tag_string_general.split(' ').filter(tag => tag.length)
        };
    }

    public override createEmbedBuilder({ prefix, suffix }: { prefix?: string, suffix?: string; } = {}): EmbedBuilder {
        const embed = super.createEmbedBuilder(...arguments);
        if (!suffix) embed.setFooter({ text: `${prefix ?? 'Powered by'} ${Util.capitaliseString(this.api.subDomain)}`, iconURL: 'https://dl.airtable.com/.attachments/e0faba2e2b9f1cc1ad2b07b9ed6e63a3/9fdd81b5/512x512bb.jpg' });
        if (suffix) embed.setAuthor({ name: `${Util.capitaliseString(this.api.subDomain)} ${suffix}`, iconURL: 'https://dl.airtable.com/.attachments/e0faba2e2b9f1cc1ad2b07b9ed6e63a3/9fdd81b5/512x512bb.jpg' });
        return embed;
    }

    public addDonmaiImageReply(tags: string | null, post: DonmaiAPIPost, count: DonmaiAPICount): this {
        const postData = DonmaiReplyBuilder.transformPost(post, count, this.api.subDomain);
        this.addImageEmbed({ tags, post: postData });
        this.addImageActionRow(postData);
        return this;
    }

    public addDonmaiTagsReply(tags: string | null, post: DonmaiAPIPost, count: DonmaiAPICount): this {
        const postData = DonmaiReplyBuilder.transformPost(post, count, this.api.subDomain);
        this.addTagsEmbed({ tags, post: postData });
        this.addTagsActionRow(postData);
        return this;
    }

    public addDonmaiSuggestionsReply({ tags, autocomplete, message, command }: { tags: string | null, autocomplete: DonmaiAPIAutocomplete[], message?: string, command: ChatInputCommandInteraction; }): this {
        const suggestions = autocomplete.map(tag => { return { name: tag.value, count: tag.post_count }; });
        this.addSuggestionsEmbed({ tags: tags ?? '', suggestions, command, message });
        if (suggestions.length) this.addSuggestionsActionRow({ suggestions });
        return this;
    }
}
