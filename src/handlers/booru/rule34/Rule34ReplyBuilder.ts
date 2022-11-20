import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { BooruPostData } from '../../../discord/builders/booru/BooruReplyBuilder.js';
import { ReplyBuilder } from '../../../discord/builders/ReplyBuilder.js';
import { Rule34APIAutocomplete, Rule34APIPost } from './api/Rule34API.js';

export class Rule34ReplyBuilder extends ReplyBuilder {

    protected static transformPost(post: Rule34APIPost): BooruPostData {
        return {
            score: parseInt(post.score),
            count: post.count.total,
            imageURL: post.file_url,
            postURL: `https://rule34.xxx/index.php?page=post&s=view&id=${post.id}`,
            tags_characters: [],
            tags_species: [],
            tags_general: post.tags.split(' ').filter(tag => tag.length)
        };
    }

    public override createEmbedBuilder({ prefix, suffix }: { prefix?: string, suffix?: string; } = {}): EmbedBuilder {
        const embed = super.createEmbedBuilder(...arguments);
        if (!suffix) embed.setFooter({ text: `${prefix ?? 'Powered by'} rule34`, iconURL: 'https://rule34.xxx/apple-touch-icon-precomposed.png' });
        if (suffix) embed.setAuthor({ name: `rule34 ${suffix}`, iconURL: 'https://rule34.xxx/apple-touch-icon-precomposed.png' });
        return embed;
    }

    public addRule34ImageReply({ tags, post }: { tags: string | null, post: Rule34APIPost; }): this {
        const postData = Rule34ReplyBuilder.transformPost(post);
        this.addImageEmbed({ tags, post: postData });
        this.addImageActionRow(postData);
        return this;
    }

    public addRule34TagsReply({ tags, post }: { tags: string | null, post: Rule34APIPost; }): this {
        const postData = Rule34ReplyBuilder.transformPost(post);
        this.addTagsEmbed({ tags, post: postData });
        this.addTagsActionRow(postData);
        return this;
    }

    public addRule34SuggestionsReply({ tags, autocomplete, command }: { tags: string, autocomplete: Rule34APIAutocomplete[], command: ChatInputCommandInteraction; }): this {
        const suggestions = autocomplete.map(tag => { return { name: tag.value, count: tag.total }; });
        this.addSuggestionsEmbed({ tags, suggestions, command });
        this.addSuggestionsActionRow({ suggestions });
        return this;
    }
}
