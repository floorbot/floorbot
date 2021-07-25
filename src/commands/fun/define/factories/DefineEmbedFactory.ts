import { HandlerContext, HandlerEmbed } from 'discord.js-commands';
import { DefineHandler, UrbanDictionaryData } from '../../../..';
import { Util } from 'discord.js';

export class DefineEmbedFactory {

    public static getDefinitionEmbed(handler: DefineHandler, context: HandlerContext, definitions: UrbanDictionaryData | UrbanDictionaryData[], page?: number): HandlerEmbed {
        const definition = Array.isArray(definitions) ? definitions[page ?? 0]! : definitions;
        const embed = handler.getEmbedTemplate(context)
            .setTitle(`${definition.word}`)
            .setURL(definition.permalink)
            .setDescription(Util.splitMessage(definition.definition.replace(/(\[|\])/g, '*'), { maxLength: 2048, char: '', append: '...' })[0]!);
        if (Array.isArray(definitions)) embed.setFooter(`${(page ?? 0) + 1}/${definitions.length} - ${embed.footer!.text}`, embed.footer!.iconURL)
        if (definition.example.length) {
            embed.addField('Example', Util.splitMessage(definition.example.replace(/(\[|\])/g, '*'), { maxLength: 1024, char: '', append: '...' })[0]!);
        }
        return embed
    }
}
