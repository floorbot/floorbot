import { EmbedFactory, HandlerContext, HandlerEmbed } from 'discord.js-commands';
import { UrbanDictionaryData, DefineCustomData } from '../../../..';
import { Util, MessageEmbed, MessageEmbedOptions } from 'discord.js';
import { DefineHandler } from '../DefineHandler';

export class DefineEmbedFactory extends EmbedFactory<DefineHandler> {

    constructor(handler: DefineHandler) {
        super(handler);
    }

    public override getEmbedTemplate(context: HandlerContext, data?: MessageEmbed | MessageEmbedOptions): HandlerEmbed {
        return super.getEmbedTemplate(context, data)
            .setFooter('Powered by Urban Dictionary', 'https://i.pinimg.com/originals/f2/aa/37/f2aa3712516cfd0cf6f215301d87a7c2.jpg');
    }

    public getDefinitionEmbed(context: HandlerContext, defineData: DefineCustomData, definitions: Array<UrbanDictionaryData>): HandlerEmbed {
        const definition = definitions[defineData.page]!;
        const embed = this.getEmbedTemplate(context)
            .setTitle(definition.word)
            .setURL(definition.permalink)
            .setDescription(Util.splitMessage(definition.definition.replace(/(\[|\])/g, '*'), { maxLength: 2048, char: '', append: '...' })[0]!)
            .setFooter(`${defineData.page + 1}/${definitions.length} - Powered by Urban Dictionary`, 'https://i.pinimg.com/originals/f2/aa/37/f2aa3712516cfd0cf6f215301d87a7c2.jpg')
        if (definition.example.length) {
            embed.addField('Example', Util.splitMessage(definition.example.replace(/(\[|\])/g, '*'), { maxLength: 1024, char: '', append: '...' })[0]!);
        }
        return embed;
    }

    public getNotFoundEmbed(context: HandlerContext, query: string): HandlerEmbed {
        return this.getEmbedTemplate(context)
            .setDescription([
                `Sorry! I could not define \`${query}\` 😟`,
                '*Please check your spelling or try another word!*'
            ].join('\n'))
    }
}
