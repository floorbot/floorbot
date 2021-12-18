import { UrbanDictionaryAPIData } from "../../../lib/apis/urban-dictionary/UrbanDictionaryAPI.js";
import { HandlerUtil, NonEmptyArray } from "../../../lib/discord/HandlerUtil.js";
import { EmbedBuilder } from "../../../lib/discord/builders/EmbedBuilder.js";
import { ReplyBuilder } from "../../../lib/discord/builders/ReplyBuilder.js";
import { MixinConstructor } from "../../../lib/ts-mixin-extended.js";

export class DefineReplyBuilder extends DefineReplyMixin(ReplyBuilder) { };

export function DefineReplyMixin<T extends MixinConstructor<ReplyBuilder>>(Builder: T) {
    return class DefineReplyBuilder extends Builder {

        protected createDefineEmbedBuilder(pageData?: { pages: number; page: number; }): EmbedBuilder {
            const embed = super.createEmbedBuilder();
            const iconURL = 'https://i.pinimg.com/originals/f2/aa/37/f2aa3712516cfd0cf6f215301d87a7c2.jpg';
            if (pageData) {
                const page = HandlerUtil.resolvePage(pageData.page, pageData.pages);
                embed.setFooter(`${page + 1}/${pageData.pages} - Powered by Urban Dictionary`, iconURL);
            } else {
                embed.setFooter(`Powered by Urban Dictionary`, iconURL);
            }
            return embed;
        }

        public addDefinitionEmbed(definitions: NonEmptyArray<UrbanDictionaryAPIData>, page: number): this {
            const definition = HandlerUtil.resolveArrayPage(definitions, page);
            const definitionString = definition.definition.replace(/(\[|\])/g, '*');
            const embed = this.createDefineEmbedBuilder({ page: page, pages: definitions.length })
                .setDescription(HandlerUtil.shortenMessage(definitionString, { maxLength: 1024 }))
                .setTitle(definition.word)
                .setURL(definition.permalink);
            if (definition.example.length) {
                const exampleString = definition.example.replace(/(\[|\])/g, '*');
                embed.addField('Example', HandlerUtil.shortenMessage(exampleString, { maxLength: 512 }));
            }
            return this.addEmbed(embed);
        }

        public addDefinitionPageActionRow(definitions: NonEmptyArray<UrbanDictionaryAPIData>, page: number): this {
            const definition = HandlerUtil.resolveArrayPage(definitions, page);
            return this.addPageActionRow(definition.permalink, undefined, definitions.length <= 1);
        }
    };
}
