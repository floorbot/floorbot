import { E621APIAutocomplete, E621APIPost } from '../../../app/api/apis/e621/E621API.js';
import { BooruPostData } from '../../../app/builders/booru/BooruReplyBuilder.js';
import { ReplyBuilder } from '../../../discord/builders/ReplyBuilder.js';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export class E621ReplyBuilder extends ReplyBuilder {

    protected static transformPost(post: E621APIPost): BooruPostData {
        return {
            score: post.score.total,
            count: null,
            imageURL: post.file.url,
            postURL: `https://e621.net/posts/${post.id}`,
            tags_characters: post.tags.character,
            tags_species: post.tags.species,
            tags_general: post.tags.general
        };
    }

    public override createEmbedBuilder({ prefix, suffix }: { prefix?: string, suffix?: string; } = {}): EmbedBuilder {
        const embed = super.createEmbedBuilder(...arguments);
        if (!suffix) embed.setFooter({ text: `${prefix ?? 'Powered by'} e621`, iconURL: 'https://en.wikifur.com/w/images/d/dd/E621Logo.png' });
        if (suffix) embed.setAuthor({ name: `e621 ${suffix}`, iconURL: 'https://en.wikifur.com/w/images/d/dd/E621Logo.png' });
        return embed;
    }

    public addE621ImageReply({ tags, post }: { tags: string | null, post: E621APIPost; }): this {
        const postData = E621ReplyBuilder.transformPost(post);
        this.addImageEmbed({ tags, post: postData });
        this.addImageActionRow(postData);
        return this;
    }

    public addE621TagsReply({ tags, post }: { tags: string | null, post: E621APIPost; }): this {
        const postData = E621ReplyBuilder.transformPost(post);
        this.addTagsEmbed({ tags, post: postData });
        this.addTagsActionRow(postData);
        return this;
    }

    public addE621SuggestionsReply({ tags, autocomplete, command }: { tags: string, autocomplete: E621APIAutocomplete[], command: ChatInputCommandInteraction; }): this {
        const suggestions = autocomplete.map(tag => { return { name: tag.name, count: tag.post_count }; });
        this.addSuggestionsEmbed({ tags, suggestions, command });
        this.addSuggestionsActionRow({ suggestions });
        return this;
    }
}
