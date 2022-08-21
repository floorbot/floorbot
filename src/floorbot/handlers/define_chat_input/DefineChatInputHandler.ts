import { AutocompleteInteraction, ButtonInteraction, ChatInputCommandInteraction } from "discord.js";
import { DefineSlashCommandOption, DefineCommand } from './builders/DefineCommand.js';
import { PageableButtonId } from '../../helpers/builders/pageable/PageableButton.js';
import { UrbanDictionaryAPI } from './urban_dictionary/UrbanDictionaryAPI.js';
import { ChatInputCommandHandler, IAutocomplete } from "discord.js-handlers";
import { IORedisAPICache } from '../../../lib/api/caches/IORedisAPICache.js';
import { DefineReply } from "./builders/DefineReply.js";
import { Pageable } from '../../../lib/Pageable.js';
import { Util } from '../../helpers/Util.js';
import { Redis } from 'ioredis';

export class DefineChatInputHandler extends ChatInputCommandHandler implements IAutocomplete {

    private readonly api: UrbanDictionaryAPI;

    constructor(redis: Redis) {
        super(DefineCommand.slashCommand());
        const apiCache = new IORedisAPICache({ redis, ttl: 1000 * 60 * 60 });
        this.api = new UrbanDictionaryAPI({ cache: apiCache });
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
        const query = command.options.getString(DefineSlashCommandOption.Query);
        const definitions = await this.api.define(query);

        // Check and reply if no definition is found
        if (!Pageable.isNonEmptyArray(definitions)) {
            const replyOptions = new DefineReply(command)
                .addDefinitionNotFoundEmbed(query);
            return command.followUp(replyOptions).then(undefined);
        }

        // Create a pageable reply for the definitions
        const pageable = new Pageable(definitions);
        const replyOptions = new DefineReply(command)
            .addDefinitionEmbed(pageable)
            .addDefinitionPageableButtonActionRow(pageable);
        const message = await command.followUp(replyOptions);

        // Handle the pageable button interactions
        const collector = Util.createComponentCollector(command.client, message);
        collector.on('collect', async (component: ButtonInteraction) => {
            await component.deferUpdate();
            if (component.customId === PageableButtonId.NextPage) pageable.page++;
            if (component.customId === PageableButtonId.PreviousPage) pageable.page--;
            const replyOptions = new DefineReply(command)
                .addDefinitionEmbed(pageable)
                .addDefinitionPageableButtonActionRow(pageable);
            await component.editReply(replyOptions);
        });
    }
}
