import { CommandInteraction, Message, MessageActionRow, MessageOptions, Util, Constants, MessageButton } from 'discord.js';
import { UrbanDictionaryAPI, UrbanDictionaryData } from './UrbanDictionaryAPI';
import { HandlerEmbed } from '../../../components/HandlerEmbed';
import { DefineCommandData } from './DefineCommandData';
import { HandlerContext } from '../../../discord/Util';
import { BaseHandler } from '../../BaseHandler';

const { MessageButtonStyles } = Constants;

export class DefineHandler extends BaseHandler {

    constructor() {
        super({
            id: 'define',
            group: 'Fun',
            global: false,
            nsfw: false,
            data: DefineCommandData
        })
    }

    public async execute(iCommand: CommandInteraction): Promise<any> {
        await iCommand.deferReply();
        let page = 0;
        const query = iCommand.options.getString('query');
        const response = await this.fetchResponse(iCommand, query, page);
        let message = await iCommand.followUp(response) as Message;
        const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 10 });
        collector.on('collect', async (iButton) => {
            await iButton.deferUpdate();
            message = iButton.message as Message;
            if (iButton.customId === 'next') page++;
            if (iButton.customId === 'previous') page--;
            const response = await this.fetchResponse(iButton, query, page);
            message = await message.edit(response);
        });
        collector.on('end', this.createEnderFunction(message))
    }

    private async fetchResponse(context: HandlerContext, query: string | null, page: number = 0): Promise<MessageOptions> {
        if (query) {
            const term = Util.escapeMarkdown(query);
            const definitions = await UrbanDictionaryAPI.define(term);
            if (!definitions.length) this.getNotFoundResponse(context, term);
            page = page % definitions.length;
            page = page >= 0 ? page : definitions.length + page;
            const embed = this.getDefinitionEmbed(this, context, definitions, page);
            const actionRow = new MessageActionRow().addComponents([
                new MessageButton().setLabel('Previous').setStyle(MessageButtonStyles.PRIMARY).setCustomId('previous'),
                new MessageButton().setLabel('Next').setStyle(MessageButtonStyles.PRIMARY).setCustomId('next')
            ])
            return { embeds: [embed], components: [actionRow] };
        } else {
            const definitions = await UrbanDictionaryAPI.random();
            const embed = this.getDefinitionEmbed(this, context, definitions[0]!);
            return { embeds: [embed] };
        }
    }

    public getDefinitionEmbed(handler: DefineHandler, context: HandlerContext, definitions: UrbanDictionaryData | UrbanDictionaryData[], page?: number): HandlerEmbed {
        const definition = Array.isArray(definitions) ? definitions[page ?? 0]! : definitions;
        const embed = handler.getEmbedTemplate(context)
            .setFooter('Powered by Urban Dictionary', 'https://i.pinimg.com/originals/f2/aa/37/f2aa3712516cfd0cf6f215301d87a7c2.jpg')
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
