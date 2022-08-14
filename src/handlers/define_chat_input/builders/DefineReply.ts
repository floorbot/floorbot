import { UrbanDictionaryAPIDefinition } from '../urban_dictionary/interfaces/UrbanDictionaryAPIDefinition.js';
import { AvatarAttachmentExpression, ResourceAttachmentBuilder } from '../../../helpers/ResourceMixins.js';
import { PageableActionRow } from '../../../helpers/pageable/PageableActionRow.js';
import { ReplyBuilder } from '../../../lib/discord.js/builders/ReplyBuilder.js';
import { EmbedBuilder } from '../../../lib/discord.js/builders/EmbedBuilder.js';
import { Pageable } from '../../../helpers/pageable/Pageable.js';
import { Util } from '../../../helpers/Util.js';

export class DefineReply extends ReplyBuilder {

    protected createDefineEmbedBuilder(pageable?: Pageable<UrbanDictionaryAPIDefinition>): EmbedBuilder {
        const embed = super.createEmbedBuilder().setFooter({
            iconURL: 'https://i.pinimg.com/originals/f2/aa/37/f2aa3712516cfd0cf6f215301d87a7c2.jpg',
            text: [
                ...(pageable ? [`${pageable.currentPage}/${pageable.totalPages} -`] : []),
                'Powered by Urban Dictionary'
            ]
        });
        return embed;
    }

    public addDefinitionEmbed(pageable: Pageable<UrbanDictionaryAPIDefinition>): this {
        const definition = pageable.getPageFirst();
        const definitionString = definition.definition.replace(/(\[|\])/g, '*');
        const embed = this.createDefineEmbedBuilder(pageable)
            .setDescription(Util.shortenText(definitionString, { maxLength: 1024 }))
            .setURL(definition.permalink)
            .setTitle(definition.word);
        if (definition.example.length) {
            const exampleString = definition.example.replace(/(\[|\])/g, '*');
            embed.addFields({
                name: 'Example',
                value: Util.shortenText(exampleString, { maxLength: 512 })
            });
        }
        return this.addEmbeds(embed);
    }

    public addDefinitionPageableButtonActionRow(pageable: Pageable<UrbanDictionaryAPIDefinition>): this {
        const actionRow = new PageableActionRow()
            .addViewOnlineButton(pageable.getPageFirst().permalink)
            .addPreviousPageButton({ disabled: pageable.totalPages < 2 })
            .addNextPageButton({ disabled: pageable.totalPages < 2 });
        return this.addComponents(actionRow);
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
        this.addFiles(attachment);
        this.addEmbeds(embed);
        console.log(attachment.getEmbedUrl());
        return this;
    }
}
