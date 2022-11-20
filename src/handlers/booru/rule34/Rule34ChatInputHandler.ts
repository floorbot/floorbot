import { AutocompleteInteraction, ChatInputCommandInteraction, MessageComponentInteraction, SelectMenuInteraction } from 'discord.js';
import { ChatInputCommandHandler, IAutocomplete } from 'discord.js-handlers';
import { Redis } from 'ioredis';
import { IORedisAPICache } from '../../../discord/api/caches/IORedisAPICache.js';
import { BooruMessageComponentId } from '../../../discord/builders/booru/BooruActionRowBuilder.js';
import { Util } from '../../../discord/Util.js';
import { Rule34API, Rule34APIPost } from './api/Rule34API.js';
import { Rule34ChatInputCommandData, Rule34SlashCommandStringOptionName } from './Rule34ChatInputCommandData.js';
import { Rule34ReplyBuilder } from './Rule34ReplyBuilder.js';

export class Rule34ChatInputCommandHandler extends ChatInputCommandHandler implements IAutocomplete {

    private readonly api: Rule34API;

    constructor({ redis }: { redis: Redis; }) {
        super(Rule34ChatInputCommandData);
        const apiCache = new IORedisAPICache({ redis, ttl: 1000 * 60 * 60 });
        this.api = new Rule34API({ cache: apiCache });
    }

    public async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
        const partialTags = interaction.options.getString(Rule34SlashCommandStringOptionName.Tags, true);
        const tags = partialTags.split('+');
        const partial = tags.pop();
        if (!partial) return interaction.respond([]);
        const autocomplete = await this.api.autocomplete(partial);
        const options = autocomplete.slice(0, 5).map(tag => {
            return {
                name: [...tags, tag.value].join('+'),
                value: [...tags, tag.value].join('+')
            };
        });
        return interaction.respond(options);
    }

    public async run(command: ChatInputCommandInteraction): Promise<any> {
        await command.deferReply();
        let tags = command.options.getString(Rule34SlashCommandStringOptionName.Tags);
        let post = await this.api.random(tags);

        if (!post) {
            if (tags) {
                const autocomplete = await this.api.autocomplete(tags);
                if (autocomplete.length) {
                    const replyOptions = new Rule34ReplyBuilder(command).addRule34SuggestionsReply({ tags, autocomplete, command });
                    const message = await command.followUp(replyOptions);
                    const collector = Util.createComponentCollector(command.client, message);
                    return collector.once('collect', async (component: SelectMenuInteraction) => {
                        await component.deferUpdate();
                        tags = component.values.join('+');
                        post = await this.api.random(tags);
                        const replyOptions = this.createReplyBuilder({ tags, post, command });
                        const message = await component.editReply(replyOptions);
                        if (post !== null) {
                            const collector = Util.createComponentCollector(command.client, message);
                            collector.on('collect', this.createCollectorFunction({ tags, post, command }));
                        }
                    });
                }
            }
            const replyOptions = this.createReplyBuilder({ tags, post, command });
            return await command.followUp(replyOptions);
        }

        const replyOptions = new Rule34ReplyBuilder(command).addRule34ImageReply({ tags, post });
        const message = await command.followUp(replyOptions);
        const collector = Util.createComponentCollector(command.client, message);
        collector.on('collect', this.createCollectorFunction({ tags, post, command }));
    }

    private createReplyBuilder({ tags, post, command }: { tags: string | null, post: Rule34APIPost | null, command: ChatInputCommandInteraction; }): Rule34ReplyBuilder {
        if (post === null) return new Rule34ReplyBuilder(command).addSuggestionsEmbed({ tags: tags ?? '', suggestions: [], command });
        return new Rule34ReplyBuilder(command).addRule34ImageReply({ tags, post });
    }

    private createCollectorFunction({ tags, post, command }: { tags: string | null, post: Rule34APIPost, command: ChatInputCommandInteraction; }) {
        return async (component: MessageComponentInteraction) => {
            switch (component.customId) {
                case BooruMessageComponentId.Tags: {
                    const replyOptions = new Rule34ReplyBuilder(command).addRule34TagsReply({ tags, post });
                    return await component.update(replyOptions);
                }
                case BooruMessageComponentId.Image: {
                    const replyOptions = new Rule34ReplyBuilder(command).addRule34ImageReply({ tags, post });
                    return await component.update(replyOptions);
                }
                case BooruMessageComponentId.Recycle: {
                    if (!Util.isAdminOrOwner(component, command)) {
                        const replyOptions = new Rule34ReplyBuilder(command).addAdminOrOwnerEmbed({ command, component });
                        return await component.reply(replyOptions);
                    }
                    await component.deferUpdate();
                    const recycled = await this.api.random(tags);
                    if (recycled !== null) post = recycled;
                    const replyOptions = this.createReplyBuilder({ tags, post, command });
                    return await component.editReply(replyOptions);
                }
                default: {
                    const replyOptions = new Rule34ReplyBuilder(command).addUnknownComponentEmbed({ component });
                    return await component.update(replyOptions);
                }
            }
        };
    }
}
