import { CommandInteraction, Message, MessageActionRow, Util, InteractionReplyOptions, AutocompleteInteraction } from 'discord.js';
import { HandlerButton, HandlerButtonID } from '../../../components/HandlerButton';
import { UrbanDictionaryAPI, UrbanDictionaryData } from './UrbanDictionaryAPI';
import { HandlerEmbed } from '../../../components/HandlerEmbed';
import { HandlerReply } from '../../../components/HandlerReply';
import { DefineCommandData } from './DefineCommandData';
import { BaseHandler } from '../../BaseHandler';

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

    public override async autocomplete(interaction: AutocompleteInteraction): Promise<any> {
        const partial = interaction.options.getString('query', true);
        const autocomplete = await UrbanDictionaryAPI.autocomplete(partial).catch(() => null);
        if (!autocomplete) return interaction.respond([]);
        const options = autocomplete.slice(0, 5).map(suggestion => {
            return { name: suggestion.term, value: suggestion.term }
        });
        return interaction.respond(options);
    }

    public async execute(command: CommandInteraction): Promise<any> {
        await command.deferReply();
        let page = 0;
        const query = command.options.getString('query');
        const definitions = query ?
            await UrbanDictionaryAPI.define(Util.escapeMarkdown(query)).catch(() => null) :
            await UrbanDictionaryAPI.random().catch(() => null);
        if (!definitions) return command.followUp(HandlerReply.createAPIErrorReply(command, this));
        if (!definitions.length) {
            if (!query) return command.followUp(HandlerReply.createUnexpectedErrorReply(command, this));
            else return command.followUp(HandlerReply.createNotFoundReply(command, query));
        }
        const replyOptions = this.createDefinitionReply(command, definitions, page);
        const message = await command.followUp(replyOptions) as Message;
        const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 5 });
        collector.on('collect', async component => {
            try {
                await component.deferUpdate();
                if (component.customId === HandlerButtonID.NEXT_PAGE) page++;
                if (component.customId === HandlerButtonID.PREVIOUS_PAGE) page--;
                page = page % definitions.length;
                page = page >= 0 ? page : definitions.length + page;
                const replyOptions = this.createDefinitionReply(command, definitions, page);
                await component.editReply(replyOptions);
            } catch { }
        });
        collector.on('end', this.createEnderFunction(message));
    }

    private createDefinitionReply(interaction: CommandInteraction, definitions: UrbanDictionaryData[], page: number = 0): InteractionReplyOptions {
        const definition = definitions[page];
        if (!definition) return HandlerReply.createUnexpectedErrorReply(interaction, this);
        const embed = new HandlerEmbed()
            .setContextAuthor(interaction)
            .setTitle(`${definition.word}`)
            .setURL(definition.permalink)
            .setDescription(Util.splitMessage(definition.definition.replace(/(\[|\])/g, '*'), { maxLength: 2048, char: '', append: '...' })[0]!)
            .setFooter(`${(page) + 1}/${definitions.length} - Powered by Urban Dictionary`, 'https://i.pinimg.com/originals/f2/aa/37/f2aa3712516cfd0cf6f215301d87a7c2.jpg')
        if (definition.example.length) {
            embed.addField('Example', Util.splitMessage(definition.example.replace(/(\[|\])/g, '*'), { maxLength: 1024, char: '', append: '...' })[0]!);
        }
        const actionRow = new MessageActionRow().addComponents([
            HandlerButton.createPreviousPageButton(),
            HandlerButton.createNextPageButton(),
        ])
        return { embeds: [embed], components: [actionRow] };
    }
}
