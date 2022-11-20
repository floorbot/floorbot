import { AutocompleteInteraction, ChatInputCommandInteraction, MessageComponentInteraction, SelectMenuInteraction } from 'discord.js';
import { ChatInputCommandHandler, IAutocomplete } from 'discord.js-handlers';
import { Redis } from 'ioredis';
import { E621API, E621APIError, E621APIPost } from '../../../app/api/apis/e621/E621API.js';
import { IORedisAPICache } from '../../../app/api/caches/IORedisAPICache.js';
import { BooruMessageComponentId } from '../../../app/builders/booru/BooruActionRowBuilder.js';
import { Util } from '../../../app/Util.js';
import { E621ChatInputCommandData, E621SlashCommandStringOptionName } from './E621ChatInputCommandData.js';
import { E621ReplyBuilder } from './E621ReplyBuilder.js';

export class E621ChatInputCommandHandler extends ChatInputCommandHandler implements IAutocomplete {

    private readonly api: E621API;

    constructor({ redis, apiKey, username, userAgent }: { redis: Redis, apiKey: string, username: string, userAgent: string; }) {
        super(E621ChatInputCommandData);
        const apiCache = new IORedisAPICache({ redis, ttl: 1000 * 60 * 60 });
        this.api = new E621API({ cache: apiCache, apiKey, username, userAgent });
    }

    public async autocomplete(autocomplete: AutocompleteInteraction): Promise<void> {
        const partialTags = autocomplete.options.getString(E621SlashCommandStringOptionName.Tags, true);
        const tags = partialTags.split('+');
        const partial = tags.pop();
        if (!partial) return autocomplete.respond([]);
        const suggestions = await this.api.autocomplete(partial);
        if (E621API.isError(suggestions)) return autocomplete.respond([]);
        const options = suggestions.slice(0, 5).map(tag => {
            return {
                name: [...tags, tag.name].join('+'),
                value: [...tags, tag.name].join('+')
            };
        });
        return autocomplete.respond(options);
    }

    public async run(command: ChatInputCommandInteraction): Promise<any> {
        await command.deferReply();
        let tags = command.options.getString(E621SlashCommandStringOptionName.Tags);
        let post = await this.api.random(tags);

        if (E621API.isError(post)) {
            if (tags && post.reason === 'not found') {
                const autocomplete = await this.api.autocomplete(tags);
                if (!E621API.isError(autocomplete) && autocomplete.length) {
                    const replyOptions = new E621ReplyBuilder(command).addE621SuggestionsReply({ tags, autocomplete, command });
                    const message = await command.followUp(replyOptions);
                    const collector = Util.createComponentCollector(command.client, message);
                    return collector.once('collect', async (component: SelectMenuInteraction) => {
                        await component.deferUpdate();
                        tags = component.values.join('+');
                        post = await this.api.random(tags);
                        const replyOptions = this.createReplyBuilder({ tags, post, command });
                        const message = await component.editReply(replyOptions);
                        if (!E621API.isError(post)) {
                            const collector = Util.createComponentCollector(command.client, message);
                            collector.on('collect', this.createCollectorFunction({ tags, post, command }));
                        }
                    });
                }
            }

            const replyOptions = this.createReplyBuilder({ tags, post, command });
            return await command.followUp(replyOptions);
        }

        const replyOptions = new E621ReplyBuilder(command).addE621ImageReply({ tags, post });
        const message = await command.followUp(replyOptions);
        const collector = Util.createComponentCollector(command.client, message);
        collector.on('collect', this.createCollectorFunction({ tags, post, command }));
    }

    private createReplyBuilder({ tags, post, command }: { tags: string | null, post: E621APIPost | E621APIError, command: ChatInputCommandInteraction; }): E621ReplyBuilder {
        if (!E621API.isError(post)) return new E621ReplyBuilder(command).addE621ImageReply({ tags, post });
        if (post.reason === 'not found') return new E621ReplyBuilder(command).addSuggestionsEmbed({ tags: tags ?? '', suggestions: [], command });
        return new E621ReplyBuilder(command).addUnexpectedErrorEmbed({ error: post.reason });
    }

    private createCollectorFunction({ tags, post, command }: { tags: string | null, post: E621APIPost, command: ChatInputCommandInteraction; }) {
        return async (component: MessageComponentInteraction) => {
            switch (component.customId) {
                case BooruMessageComponentId.Tags: {
                    const replyOptions = new E621ReplyBuilder(command).addE621TagsReply({ tags, post });
                    return await component.update(replyOptions);
                }
                case BooruMessageComponentId.Image: {
                    const replyOptions = new E621ReplyBuilder(command).addE621ImageReply({ tags, post });
                    return await component.update(replyOptions);
                }
                case BooruMessageComponentId.Recycle: {
                    if (!Util.isAdminOrOwner(component, command)) {
                        const replyOptions = new E621ReplyBuilder(command).addAdminOrOwnerEmbed({ command, component });
                        return await component.reply(replyOptions);
                    }
                    await component.deferUpdate();
                    const recycled = await this.api.random(tags);
                    if (!E621API.isError(recycled)) post = recycled;
                    const replyOptions = this.createReplyBuilder({ tags, post, command });
                    return await component.editReply(replyOptions);
                }
                default: {
                    const replyOptions = new E621ReplyBuilder(command).addUnknownComponentEmbed({ component });
                    return await component.update(replyOptions);
                }
            }
        };
    }
}
