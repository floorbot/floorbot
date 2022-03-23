import { AutocompleteInteraction, ChatInputApplicationCommandData, ChatInputCommandInteraction } from "discord.js";
import { DefineChatInputCommandData, DefineChatInputOption } from "./DefineChatInputCommandData.js";
import { PageableComponentID } from "../../lib/builders/PageableButtonActionRowBuilder.js";
import { ApplicationCommandHandler, IAutocomplete } from "discord.js-handlers";
import { DiscordUtil } from '../../lib/discord/DiscordUtil.js';
import { DefineReplyBuilder } from "./DefineReplyBuilder.js";
import { UrbanDictionaryAPI } from 'urban-dictionary';
import { Pageable } from "../../lib/Pageable.js";
import { Redis } from 'ioredis';

export class DefineChatInputHandler extends ApplicationCommandHandler<ChatInputApplicationCommandData> implements IAutocomplete {

    private readonly api: UrbanDictionaryAPI;

    constructor(redis: Redis) {
        super(DefineChatInputCommandData);
        this.api = new UrbanDictionaryAPI({ redis });
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

    public async run(command: ChatInputCommandInteraction): Promise<void> {
        await command.deferReply();
        const query = command.options.getString(DefineChatInputOption.Query);
        const definitions = await this.api.define(query);

        // Check and reply if no definition is found
        if (!Pageable.isNonEmptyArray(definitions)) {
            const replyOptions = new DefineReplyBuilder(command)
                .addDefinitionNotFoundEmbed(query);
            return command.followUp(replyOptions).then(undefined);
        }

        // Create a pageable reply for the definitions
        const pageable = new Pageable(definitions);
        const replyOptions = new DefineReplyBuilder(command)
            .addDefinitionPageableButtonActionRow(pageable)
            .addDefinitionEmbed(pageable);
        const message = await command.followUp(replyOptions);

        // Handle the pageable button interactions
        const collector = DiscordUtil.createComponentCollector(command.client, message);
        collector.on('safeCollect', async component => {
            await component.deferUpdate();
            if (component.customId === PageableComponentID.NEXT_PAGE) pageable.page++;
            if (component.customId === PageableComponentID.PREVIOUS_PAGE) pageable.page--;
            const replyOptions = new DefineReplyBuilder(command)
                .addDefinitionEmbed(pageable)
                .addDefinitionPageableButtonActionRow(pageable);
            await component.editReply(replyOptions);
        });
    }
}
