import { CommandInteraction, Message, Util, AutocompleteInteraction } from 'discord.js';
import { UrbanDictionaryAPI } from '../../../apis/urban-dictionary/UrbanDictionaryAPI.js';
import { HandlerButtonID } from '../../../discord/helpers/components/HandlerButton.js';
import { ChatInputHandler } from '../../../discord/handlers/abstracts/ChatInputHandler.js';
import { Autocomplete } from '../../../discord/handlers/interfaces/Autocomplete.js';
import { HandlerReplies } from '../../../discord/helpers/HandlerReplies.js';
import { HandlerUtil } from '../../../discord/HandlerUtil.js';
import { DefineCommandData } from './DefineCommandData.js';
import { DefineReplies } from './DefineReplies.js';

export class DefineHandler extends ChatInputHandler implements Autocomplete {

    private readonly api: UrbanDictionaryAPI;
    private readonly replies: DefineReplies;

    constructor() {
        super({ group: 'Fun', global: false, nsfw: false, data: DefineCommandData })
        this.api = new UrbanDictionaryAPI();
        this.replies = new DefineReplies();
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
        const replyOptions = this.replies.createDefinitionReply(command, definitions, page);
        const message = await command.followUp(replyOptions) as Message;
        const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 5 });
        collector.on('collect', HandlerUtil.handleCollectorErrors(async component => {
            await component.deferUpdate();
            if (component.customId === HandlerButtonID.NEXT_PAGE) page++;
            if (component.customId === HandlerButtonID.PREVIOUS_PAGE) page--;
            page = page % definitions.length;
            page = page >= 0 ? page : definitions.length + page;
            const replyOptions = this.replies.createDefinitionReply(command, definitions, page);
            await component.editReply(replyOptions);
        }));
        collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
    }
}
