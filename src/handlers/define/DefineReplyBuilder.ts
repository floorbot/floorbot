import { ActionRowBuilder, EmbedBuilder, MessageActionRowComponentBuilder } from 'discord.js';
import { AvatarExpression, FloorbotAttachmentBuilder } from '../../core/builders/floorbot/FloorbotAttachmentBuilder.js';
import { ReplyEmbedBuilderOptions } from '../../core/builders/floorbot/FloorbotReplyBuilder.js';
import { ReplyBuilder } from '../../core/builders/ReplyBuilder.js';
import { Pageable } from '../../core/Pageable.js';
import { Util } from '../../core/Util.js';
import { UrbanDictionaryAPIDefinition } from './urban_dictionary/UrbanDictionaryAPI.js';

export class DefineReplyBuilder extends ReplyBuilder {

    public override createEmbedBuilder(options: ReplyEmbedBuilderOptions & { pageable?: Pageable<UrbanDictionaryAPIDefinition>; } = {}): EmbedBuilder {
        const { pageable } = options;
        return super.createEmbedBuilder(options)
            .setFooter({
                iconURL: 'https://i.pinimg.com/originals/f2/aa/37/f2aa3712516cfd0cf6f215301d87a7c2.jpg',
                text: [
                    ...(pageable ? [pageable.toString()] : []),
                    'Powered by Urban Dictionary'
                ].join(' - ')
            });
    }

    public addDefinitionEmbed(pageable: Pageable<UrbanDictionaryAPIDefinition>): this {
        const definition = pageable.getPageFirst();
        const definitionString = definition.definition.replace(/(\[|\])/g, '*');
        const embed = this.createEmbedBuilder({ pageable })
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

    public addDefinitionActionRow(pageable: Pageable<UrbanDictionaryAPIDefinition>): this {
        const actionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>()
            .addViewOnlineButton(pageable.getPageFirst().permalink)
            .addPreviousPageButton({ disabled: pageable.totalPages < 2 })
            .addNextPageButton({ disabled: pageable.totalPages < 2 });
        return this.addComponents(actionRow);
    }

    public addDefinitionNotFoundEmbed(query?: string | null): this {
        const attachment = FloorbotAttachmentBuilder.avatarExpression({ expression: AvatarExpression.Frown });
        const embed = this.createEmbedBuilder()
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription(query ? [
                `Sorry! I could not find any definitions for \`${query}\``,
                `*Please check your spelling or try again later!*`
            ].join('\n') : [
                `Sorry! I could not random any definitions`,
                `*Please try again later in a few minutes!*`
            ].join('\n'));
        this.addFiles(attachment);
        this.addEmbeds(embed);
        return this;
    }
}
