import { AvatarAttachmentExpression, ResourceAttachmentBuilder } from "../../lib/builders/ResourceMixins.js";
import { PageableButtonActionRowBuilder } from "../../lib/builders/PageableButtonActionRowBuilder.js";
import { UrbanDictionaryAPIData } from "../../lib/apis/urban-dictionary/UrbanDictionaryAPI.js";
import { ReplyBuilder } from "../../lib/discord/builders/ReplyBuilder.js";
import { EmbedBuilder } from "../../lib/discord/builders/EmbedBuilder.js";
import { DiscordUtil } from '../../lib/discord/DiscordUtil.js';
import { Pageable } from "../../lib/Pageable.js";

export class DefineReplyBuilder extends ReplyBuilder {

    protected createDefineEmbedBuilder(pageable?: Pageable<UrbanDictionaryAPIData>): EmbedBuilder {
        const embed = super.createEmbedBuilder().setFooter({
            iconURL: 'https://i.pinimg.com/originals/f2/aa/37/f2aa3712516cfd0cf6f215301d87a7c2.jpg',
            text: [
                ...(pageable ? [`${pageable.currentPage + 1}/${pageable.totalPages} -`] : []),
                'Powered by Urban Dictionary'
            ]
        });
        return embed;
    }

    public addDefinitionEmbed(pageable: Pageable<UrbanDictionaryAPIData>): this {
        const definition = pageable.getPageFirst();
        const definitionString = definition.definition.replace(/(\[|\])/g, '*');
        const embed = this.createDefineEmbedBuilder(pageable)
            .setDescription(DiscordUtil.shortenMessage(definitionString, { maxLength: 1024 }))
            .setURL(definition.permalink)
            .setTitle(definition.word);
        if (definition.example.length) {
            const exampleString = definition.example.replace(/(\[|\])/g, '*');
            embed.addField({
                name: 'Example',
                value: DiscordUtil.shortenMessage(exampleString, { maxLength: 512 })
            });
        }
        return this.addEmbed(embed);
    }

    public addDefinitionPageableButtonActionRow(pageable: Pageable<UrbanDictionaryAPIData>): this {
        const actionRow = new PageableButtonActionRowBuilder();
        actionRow.addViewOnlineButton(pageable.getPageFirst().permalink);
        actionRow.addPreviousPageButton(null, pageable.totalPages < 2);
        actionRow.addNextPageButton(null, pageable.totalPages < 2);
        return this.addActionRow(actionRow);
    }

    public addDefinitionNotFoundEmbed(query?: string | null): this {
        const attachment = ResourceAttachmentBuilder.createAvatarAttachment(AvatarAttachmentExpression.FROWN);
        const embed = this.createDefineEmbedBuilder()
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription(query ? [
                `Sorry! I could not find any definitions for \`${query}\``,
                `*Please check your spelling or try again later!*`
            ] : [
                `Sorry! I could not random any definitions`,
                `*Please try again later in a few minutes!*`
            ]);
        this.addFile(attachment);
        this.addEmbed(embed);
        return this;
    }
}
