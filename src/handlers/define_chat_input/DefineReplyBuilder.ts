import { UrbanDictionaryAPIDefinition } from '../../apis/urban_dictionary/interfaces/UrbanDictionaryAPIDefinition.js';
import { AvatarAttachmentExpression, ResourceAttachmentBuilder } from '../../lib/helpers/ResourceMixins.js';
import { PageableButtonActionRowBuilder } from '../../lib/helpers/PageableButtonActionRowBuilder.js';
import { EmbedBuilder } from '../../lib/builders/EmbedBuilder.js';
import { ReplyBuilder } from '../../lib/builders/ReplyBuilder.js';
import { Pageable } from '../../lib/helpers/Pageable.js';
import { Util } from '../../lib/helpers/Util.js';

export class DefineReplyBuilder extends ReplyBuilder {

    protected createDefineEmbedBuilder(pageable?: Pageable<UrbanDictionaryAPIDefinition>): EmbedBuilder {
        const embed = super.createEmbedBuilder().setFooter({
            iconURL: 'https://i.pinimg.com/originals/f2/aa/37/f2aa3712516cfd0cf6f215301d87a7c2.jpg',
            text: [
                ...(pageable ? [`${pageable.currentPage + 1}/${pageable.totalPages} -`] : []),
                'Powered by Urban Dictionary'
            ]
        });
        return embed;
    }

    public addDefinitionEmbed(pageable: Pageable<UrbanDictionaryAPIDefinition>): this {
        const definition = pageable.getPageFirst();
        const definitionString = definition.definition.replace(/(\[|\])/g, '*');
        const embed = this.createDefineEmbedBuilder(pageable)
            .setDescription(Util.shortenMessage(definitionString, { maxLength: 1024 }))
            .setURL(definition.permalink)
            .setTitle(definition.word);
        if (definition.example.length) {
            const exampleString = definition.example.replace(/(\[|\])/g, '*');
            embed.addField({
                name: 'Example',
                value: Util.shortenMessage(exampleString, { maxLength: 512 })
            });
        }
        return this.addEmbed(embed);
    }

    public addDefinitionPageableButtonActionRow(pageable: Pageable<UrbanDictionaryAPIDefinition>): this {
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
