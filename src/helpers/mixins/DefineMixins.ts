import { AvatarAttachmentExpression, ResourceAttachmentBuilder } from "./ResourceMixins.js";
import { UrbanDictionaryAPIData } from "../../lib/apis/urban-dictionary/UrbanDictionaryAPI.js";
import { EmbedBuilder } from "../../lib/discord/builders/EmbedBuilder.js";
import { ReplyBuilder } from "../../lib/discord/builders/ReplyBuilder.js";
import { MixinConstructor } from "../../lib/ts-mixin-extended.js";
import { HandlerUtil } from "../../lib/discord/HandlerUtil.js";
import { PageableActionRowBuilder } from "./PageableMixins.js";
import { Pageable } from "../Pageable.js";

export class DefineReplyBuilder extends DefineReplyMixin(ReplyBuilder) { };

export function DefineReplyMixin<T extends MixinConstructor<ReplyBuilder>>(Builder: T) {
    return class DefineReplyBuilder extends Builder {

        protected createDefineEmbedBuilder(pageable?: Pageable<UrbanDictionaryAPIData>): EmbedBuilder {
            const embed = super.createEmbedBuilder();
            const iconURL = 'https://i.pinimg.com/originals/f2/aa/37/f2aa3712516cfd0cf6f215301d87a7c2.jpg';
            if (pageable) {
                embed.setFooter(`${pageable.currentPage}/${pageable.totalPages} - Powered by Urban Dictionary`, iconURL);
            } else {
                embed.setFooter(`Powered by Urban Dictionary`, iconURL);
            }
            return embed;
        }

        public addDefinitionEmbed(pageable: Pageable<UrbanDictionaryAPIData>): this {
            const definition = pageable.pageData;
            const definitionString = definition.definition.replace(/(\[|\])/g, '*');
            const embed = this.createDefineEmbedBuilder(pageable)
                .setDescription(HandlerUtil.shortenMessage(definitionString, { maxLength: 1024 }))
                .setURL(definition.permalink)
                .setTitle(definition.word);
            if (definition.example.length) {
                const exampleString = definition.example.replace(/(\[|\])/g, '*');
                embed.addField('Example', HandlerUtil.shortenMessage(exampleString, { maxLength: 512 }));
            }
            return this.addEmbed(embed);
        }

        public addDefinitionPageActionRow(pageable: Pageable<UrbanDictionaryAPIData>): this {
            const actionRow = new PageableActionRowBuilder();
            actionRow.addViewOnlineButton(pageable.pageData.permalink);
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
    };
}
