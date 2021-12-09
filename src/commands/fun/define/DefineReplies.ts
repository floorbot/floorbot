import { Interaction, InteractionReplyOptions, Message, MessageActionRow, Util } from 'discord.js';
import { UrbanDictionaryAPIData } from '../../../apis/urban-dictionary/UrbanDictionaryAPI.js';
import { HandlerButton } from '../../../discord/helpers/components/HandlerButton.js';
import { HandlerEmbed } from '../../../discord/helpers/components/HandlerEmbed.js';
import { HandlerReplies } from '../../../discord/helpers/HandlerReplies.js';

export class DefineReplies extends HandlerReplies {

    public override createEmbedTemplate(context: Interaction | Message, pageData?: { page: number, pages: number }): HandlerEmbed {
        const embed = super.createEmbedTemplate(context)
        if (pageData) embed.setFooter(`${pageData.page}/${pageData.pages} - Powered by Urban Dictionary`, 'https://i.pinimg.com/originals/f2/aa/37/f2aa3712516cfd0cf6f215301d87a7c2.jpg');
        else embed.setFooter(`Powered by Urban Dictionary`, 'https://i.pinimg.com/originals/f2/aa/37/f2aa3712516cfd0cf6f215301d87a7c2.jpg')
        return embed
    }

    public createDefinitionReply(context: Interaction | Message, definitions: UrbanDictionaryAPIData[], page: number = 0): InteractionReplyOptions {
        const definition = definitions[page];
        if (!definition) throw { definitions, page }
        const embed = this.createEmbedTemplate(context, { page: page + 1, pages: definitions.length })
            .setTitle(`${definition.word}`)
            .setURL(definition.permalink)
            .setDescription(Util.splitMessage(definition.definition.replace(/(\[|\])/g, '*'), { maxLength: 1024, char: '', append: '...' })[0]!)
        if (definition.example.length) {
            embed.addField('Example', Util.splitMessage(definition.example.replace(/(\[|\])/g, '*'), { maxLength: 512, char: '', append: '...' })[0]!);
        }
        const actionRow = new MessageActionRow().addComponents([
            HandlerButton.createPreviousPageButton(),
            HandlerButton.createNextPageButton(),
        ])
        return { embeds: [embed], components: [actionRow] };
    }
}
