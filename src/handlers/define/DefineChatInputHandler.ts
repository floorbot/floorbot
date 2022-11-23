import { AutocompleteInteraction, ButtonInteraction, ChatInputCommandInteraction } from "discord.js";
import { ChatInputCommandHandler, IAutocomplete } from "discord.js-handlers";
import { Redis } from 'ioredis';
import { IORedisAPICache } from '../../core/api/caches/IORedisAPICache.js';
import { PageableButtonId } from '../../core/builders/pageable/PageableActionRowBuilder.js';
import { Pageable } from '../../core/Pageable.js';
import { Util } from '../../core/Util.js';
import { DefineChatInputCommandData, DefineChatInputCommandOption } from './DefineChatInputCommandData.js';
import { DefineReplyBuilder } from './DefineReplyBuilder.js';
import { UrbanDictionaryAPI } from './urban_dictionary/UrbanDictionaryAPI.js';

export class DefineChatInputHandler extends ChatInputCommandHandler implements IAutocomplete {

    private readonly api: UrbanDictionaryAPI;

    constructor(redis: Redis) {
        super(DefineChatInputCommandData);
        const apiCache = new IORedisAPICache({ redis, ttl: 1000 * 60 * 60 });
        this.api = new UrbanDictionaryAPI({ cache: apiCache });
    }

    public async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
        const partial = interaction.options.getString(DefineChatInputCommandOption.Query, true);
        const autocomplete = await this.api.autocomplete(partial);
        if (!autocomplete) return interaction.respond([]);
        const options = autocomplete.slice(0, 5).map(suggestion => {
            return { name: suggestion.term, value: suggestion.term };
        });
        return interaction.respond(options);
    }

    public async run(command: ChatInputCommandInteraction): Promise<void> {
        await command.deferReply();
        const query = command.options.getString(DefineChatInputCommandOption.Query);
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
            .addDefinitionEmbed(pageable)
            .addDefinitionActionRow(pageable);
        const message = await command.followUp(replyOptions);

        // Handle the pageable button interactions
        const collector = Util.createComponentCollector(command.client, message);
        collector.on('collect', async (component: ButtonInteraction) => {
            await component.deferUpdate();
            if (component.customId === PageableButtonId.NextPage) pageable.page++;
            if (component.customId === PageableButtonId.PreviousPage) pageable.page--;
            const replyOptions = new DefineReplyBuilder(command)
                .addDefinitionEmbed(pageable)
                .addDefinitionActionRow(pageable);
            await component.editReply(replyOptions);
        });
    }
}
