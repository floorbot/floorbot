import { CommandInteraction, Message, MessageActionRow, Util, InteractionReplyOptions, AutocompleteInteraction } from 'discord.js';
import { HandlerButton, HandlerButtonID } from '../../../helpers/components/HandlerButton.js';
import { ChatInputHandler } from '../../../discord/handler/abstracts/ChatInputHandler.js';
import { UrbanDictionaryAPI, UrbanDictionaryAPIData } from './UrbanDictionaryAPI.js';
import { Autocomplete } from '../../../discord/handler/interfaces/Autocomplete.js';
import { HandlerEmbed } from '../../../helpers/components/HandlerEmbed.js';
import { HandlerUtil } from '../../../discord/handler/HandlerUtil.js';
import { HandlerReplies } from '../../../helpers/HandlerReplies.js';
import { DefineCommandData } from './DefineCommandData.js';
import { Redis } from 'ioredis';

export class DefineHandler extends ChatInputHandler implements Autocomplete {

    private readonly api: UrbanDictionaryAPI;

    constructor(redis: Redis) {
        super({ group: 'Fun', global: false, nsfw: false, data: DefineCommandData })
        this.api = new UrbanDictionaryAPI(redis);
    }

    public async autocomplete(interaction: AutocompleteInteraction): Promise<any> {
        const partial = interaction.options.getString('query', true);
        const autocomplete = await this.api.autocomplete(partial).catch(() => null);
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
            await this.api.define(Util.escapeMarkdown(query)).catch(() => null) :
            await this.api.random().catch(() => null);
        if (!definitions) return command.followUp(HandlerReplies.createAPIErrorReply(command, this));
        if (!definitions.length) {
            if (!query) return command.followUp(HandlerReplies.createUnexpectedErrorReply(command, this));
            else return command.followUp(HandlerReplies.createNotFoundReply(command, query));
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
        collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
    }

    private createDefinitionReply(interaction: CommandInteraction, definitions: UrbanDictionaryAPIData[], page: number = 0): InteractionReplyOptions {
        const definition = definitions[page];
        if (!definition) return HandlerReplies.createUnexpectedErrorReply(interaction, this);
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
