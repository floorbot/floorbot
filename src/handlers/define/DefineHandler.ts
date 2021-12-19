import { ChatInputHandler } from "../../lib/discord/handlers/abstracts/ChatInputHandler.js";
import { UrbanDictionaryAPI } from "../../lib/apis/urban-dictionary/UrbanDictionaryAPI.js";
import { Autocomplete } from "../../lib/discord/handlers/interfaces/Autocomplete.js";
import { AutocompleteInteraction, CommandInteraction, Util } from "discord.js";
import { ComponentID } from "../../lib/discord/builders/ActionRowBuilder.js";
import { HandlerUtil } from "../../lib/discord/HandlerUtil.js";
import { DefineCommandData } from "./DefineCommandData.js";
import { DefineReplyBuilder } from "./DefineMixins.js";
import { Pageable } from "../../lib/utils/Pageable.js";

export class DefineHandler extends ChatInputHandler implements Autocomplete {

    private readonly api: UrbanDictionaryAPI;

    constructor() {
        super(DefineCommandData);
        this.api = new UrbanDictionaryAPI();
    }

    public async autocomplete(interaction: AutocompleteInteraction): Promise<any> {
        const partial = interaction.options.getString('query', true);
        const autocomplete = await this.api.autocomplete(partial).catch(() => null);
        if (!autocomplete) return interaction.respond([]);
        const options = autocomplete.slice(0, 5).map(suggestion => {
            return { name: suggestion.term, value: suggestion.term };
        });
        return interaction.respond(options);
    }

    public async execute(command: CommandInteraction<'cached'>): Promise<any> {
        await command.deferReply();
        const query = command.options.getString('query');
        const definitions = query ?
            await this.api.define(Util.escapeMarkdown(query)) :
            await this.api.random();
        if (!Pageable.isNonEmptyArray(definitions)) return command.followUp(new DefineReplyBuilder(command).addNotFoundEmbed(query));
        const pageable = new Pageable(definitions);
        const replyOptions = new DefineReplyBuilder(command)
            .addDefinitionPageActionRow(pageable)
            .addDefinitionEmbed(pageable);
        const message = await command.followUp(replyOptions);
        const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 5 });
        collector.on('collect', HandlerUtil.handleCollectorErrors(async component => {
            await component.deferUpdate();
            if (component.customId === ComponentID.NEXT_PAGE) pageable.page++;
            if (component.customId === ComponentID.PREVIOUS_PAGE) pageable.page--;
            const replyOptions = new DefineReplyBuilder(command)
                .addDefinitionEmbed(pageable)
                .addDefinitionPageActionRow(pageable);
            await component.editReply(replyOptions);
        }));
        collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
    }
}
