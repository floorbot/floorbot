import { AutocompleteInteraction, ChatInputApplicationCommandData, CommandInteraction, InteractionCollector, Util } from "discord.js";
import { UrbanDictionaryAPI } from "../../lib/apis/urban-dictionary/UrbanDictionaryAPI.js";
import { ApplicationCommandHandler, IAutocomplete } from "discord.js-handlers";
import { ComponentID } from "../../lib/discord/builders/ActionRowBuilder.js";
import { HandlerUtil } from "../../lib/discord/HandlerUtil.js";
import { DefineCommandData } from "./DefineCommandData.js";
import { DefineReplyBuilder } from "./DefineMixins.js";
import { Pageable } from "../../helpers/Pageable.js";
import pVoid from "../../lib/promise-void.js";

export class DefineHandler extends ApplicationCommandHandler<ChatInputApplicationCommandData> implements IAutocomplete {

    private readonly api: UrbanDictionaryAPI;

    constructor() {
        super(DefineCommandData);
        this.api = new UrbanDictionaryAPI();
    }

    public async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
        const partial = interaction.options.getString('query', true);
        const autocomplete = await this.api.autocomplete(partial);
        if (!autocomplete) return interaction.respond([]);
        const options = autocomplete.slice(0, 5).map(suggestion => {
            return { name: suggestion.term, value: suggestion.term };
        });
        return interaction.respond(options);
    }

    public async run(command: CommandInteraction): Promise<void> {
        await command.deferReply();
        const query = command.options.getString('query');
        const definitions = query ?
            await this.api.define(Util.escapeMarkdown(query)) :
            await this.api.random();
        if (!Pageable.isNonEmptyArray(definitions)) return pVoid(command.followUp(new DefineReplyBuilder(command).addNotFoundEmbed(query)));
        const pageable = new Pageable(definitions);
        const replyOptions = new DefineReplyBuilder(command)
            .addDefinitionPageActionRow(pageable)
            .addDefinitionEmbed(pageable);
        const message = await command.followUp(replyOptions);
        const collector = new InteractionCollector(command.client, { message: message, time: 1000 * 60 * 10 });
        collector.on('collect', HandlerUtil.handleCollectorErrors(async component => {
            await component.deferUpdate();
            if (component.customId === ComponentID.NEXT_PAGE) pageable.page++;
            if (component.customId === ComponentID.PREVIOUS_PAGE) pageable.page--;
            const replyOptions = new DefineReplyBuilder(command)
                .addDefinitionEmbed(pageable)
                .addDefinitionPageActionRow(pageable);
            await component.editReply(replyOptions);
        }));
        collector.on('end', () => { command.editReply({ components: [] }); });
    }
}
