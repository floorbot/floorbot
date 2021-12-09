import { UrbanDictionaryAPIData } from "../apis/urban-dictionary/UrbanDictionaryAPI.js";
import { HandlerUtil, NonEmptyArray } from "../discord/HandlerUtil.js";
import { EmbedBuilder } from "../discord/builders/EmbedBuilder.js";
import { ReplyBuilder } from "../discord/builders/ReplyBuilder.js";

export class DefineReplyBuilder extends ReplyBuilder {

    protected override createEmbedBuilder(pageData?: { pages: number; page: number; }): EmbedBuilder {
        const embed = super.createEmbedBuilder();
        const iconURL = 'https://i.pinimg.com/originals/f2/aa/37/f2aa3712516cfd0cf6f215301d87a7c2.jpg';
        if (pageData) embed.setFooter(`${pageData.page}/${pageData.pages} - Powered by Urban Dictionary`, iconURL);
        else embed.setFooter(`Powered by Urban Dictionary`, iconURL);
        return embed;
    }

    public addDefinitionEmbed(definitions: NonEmptyArray<UrbanDictionaryAPIData>, page: number): this {
        const definition = HandlerUtil.resolveArrayPage(definitions, page);
        const definitionString = definition.definition.replace(/(\[|\])/g, '*');
        const embed = this.createEmbedBuilder({ page: page + 1, pages: definitions.length })
            .setTitle(definition.word)
            .setURL(definition.permalink)
            .setDescription(HandlerUtil.shortenMessage(definitionString, { maxLength: 1024 }));
        if (definition.example.length) {
            const exampleString = definition.example.replace(/(\[|\])/g, '*');
            embed.addField('Example', HandlerUtil.shortenMessage(exampleString, { maxLength: 512 }));
        }
        return this.addEmbed(embed);
    }
}
