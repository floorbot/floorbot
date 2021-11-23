import { Constants, Interaction, InteractionReplyOptions, Message, MessageActionRow, Util } from 'discord.js';
import { HandlerButton, HandlerButtonID } from '../../discord/helpers/components/HandlerButton.js';
import { HandlerSelectMenuID } from '../../discord/helpers/components/HandlerSelectMenu.js';
import { HandlerEmbed } from '../../discord/helpers/components/HandlerEmbed.js';
import { HandlerReplies } from '../../discord/helpers/HandlerReplies.js';

const { MessageButtonStyles } = Constants;

export interface BooruReplyConstructorOptions {
    readonly apiName: string,
    readonly apiIcon: string
}

export class BooruReplies extends HandlerReplies {

    private readonly apiName: string;
    private readonly apiIcon: string;

    constructor(options: BooruReplyConstructorOptions) {
        super();
        this.apiName = options.apiName;
        this.apiIcon = options.apiIcon;
    }

    public override createEmbedTemplate(context: Interaction | Message): HandlerEmbed {
        const embed = super.createEmbedTemplate(context);
        embed.setFooter(`Powered by ${this.apiName}`, this.apiIcon);
        return embed;
    }

    public createSuggestionReply(context: Interaction | Message, data: BooruSuggestionData): InteractionReplyOptions {

        // Embed
        const suggestionString = data.suggestions.map(tag => `${Util.escapeMarkdown(tag.name)} \`${tag.count} posts\``).join('\n');
        const embed = this.createEmbedTemplate(context);
        if (data.url404 && data.suggestions.length) embed.setThumbnail(data.url404);
        if (data.url404 && !data.suggestions.length) embed.setImage(data.url404);
        embed.setDescription(`No posts found for \`${data.tags}\`` +
            (data.suggestions.length ? `\n\n*Perhaps you meant one of the following:*\n${suggestionString}` : '')
        );

        // Select Menu
        const selectMenu = this.createSelectMenuTemplate()
            .setPlaceholder('See Suggested Tags')
            .setCustomId(BooruSelectMenuID.SUGGESTIONS)
            .addOptions(data.suggestions.map(suggestion => {
                return {
                    label: Util.splitMessage(suggestion.name, { char: '', append: '...', maxLength: 25 })[0]!,
                    description: `${suggestion.count} posts for ${suggestion.name}`,
                    value: suggestion.name
                };
            }));

        return { embeds: [embed], components: data.suggestions.length ? [selectMenu.toActionRow()] : [] };
    }

    public createImageReply(context: Interaction | Message, data: BooruImageData): InteractionReplyOptions {

        // Embed
        const escapedTags = data.tags ? Util.escapeMarkdown(data.tags).replace(/\+/g, ' ') : String();
        const embed = this.createEmbedTemplate(context)
            .setImage(data.imageURL)
            .setDescription([
                (data.tags ? `**[${escapedTags}](${data.postURL})** ` : '') + `\`score: ${data.score ?? 0}\``,
                ...(/\.swf$/.test(data.imageURL) ? [`\n\nSorry! This is a flash file 🙃\n*click the [link](${data.postURL}) to view in browser*`] : []),
                ...(/(\.webm)|(\.mp4)/.test(data.imageURL) ? [`\n\nSorry! This is a \`webm\` or \`mp4\` file which is not supported in embeds... 😕\n*click the [link](${data.postURL}) to view in browser*`] : [])
            ]);

        // View Online Button
        const viewOnlineButton = HandlerButton.createViewOnlineButton(data.postURL)

        // Recycle Button
        const recycleButton = this.createButtonTemplate()
            .setLabel('♻️')
            .setStyle(MessageButtonStyles.SUCCESS)
            .setCustomId(BooruButtonID.RECYCLE);

        // Search Again Button
        const repeatButton = this.createButtonTemplate()
            .setLabel(data.tags ? 'Search Again' : 'Random Again')
            .setStyle(MessageButtonStyles.PRIMARY)
            .setCustomId(BooruButtonID.REPEAT);

        return {
            embeds: [embed],
            components: [
                new MessageActionRow().addComponents([
                    viewOnlineButton,
                    repeatButton,
                    recycleButton
                ])
            ]
        }
    }
}

export const BooruButtonID = {
    ...HandlerButtonID, ...{
        REPEAT: 'repeat',
        RECYCLE: 'recycle'
    }
}

export const BooruSelectMenuID = {
    ...HandlerSelectMenuID, ...{
        SUGGESTIONS: 'suggestions'
    }
}

export interface BooruImageData {
    tags: string | null,
    imageURL: string,
    postURL: string,
    score: number | null
}

export interface BooruSuggestionData {
    readonly suggestions: Array<{
        readonly name: string,
        readonly count: number
    }>,
    readonly tags: string,
    readonly url404: string | null
}
