import { AutocompleteInteraction, ChatInputCommandInteraction, MessageComponentInteraction, SelectMenuInteraction } from 'discord.js';
import { ChatInputCommandHandler, IAutocomplete } from 'discord.js-handlers';
import { Redis } from 'ioredis';
import { IORedisAPICache } from '../../../discord/api/caches/IORedisAPICache.js';
import { BooruMessageComponentId } from '../../../discord/builders/booru/BooruActionRowBuilder.js';
import { Util } from '../../../discord/Util.js';
import { DonmaiAPI, DonmaiAPICount, DonmaiAPIError, DonmaiAPIPost, DonmaiAPISubDomain } from './api/DonmaiAPI.js';
import { DonmaiChatInputCommandData, DonmaiSlashCommandStringOptionName } from './DonmaiChatInputCommandData.js';
import { DonmaiReplyBuilder } from './DonmaiReplyBuilder.js';

export class DonmaiChatInputCommandHandler extends ChatInputCommandHandler implements IAutocomplete {

    private readonly api: DonmaiAPI;

    constructor({ subDomain, redis, apiKey, username, userAgent }: { subDomain: DonmaiAPISubDomain, redis: Redis, apiKey: string, username: string, userAgent?: string; }) {
        super(DonmaiChatInputCommandData.create(subDomain));
        const apiCache = new IORedisAPICache({ redis, ttl: 1000 * 60 * 60 });
        this.api = new DonmaiAPI({ subDomain, cache: apiCache, apiKey, username, userAgent });
    }

    public async autocomplete(autocomplete: AutocompleteInteraction): Promise<void> {
        const partialTags = autocomplete.options.getString(DonmaiSlashCommandStringOptionName.Tags, true);
        const tags = partialTags.split('+');
        const partial = tags.pop();
        if (!partial || !partial.length) return autocomplete.respond([]);
        const suggestions = await this.api.autocomplete(partial);
        const options = suggestions.slice(0, 5).map(tag => {
            return {
                name: [...tags, tag.value].join('+'),
                value: [...tags, tag.value].join('+')
            };
        });
        return autocomplete.respond(options);
    }

    public async run(command: ChatInputCommandInteraction): Promise<any> {
        await command.deferReply();
        let tags = command.options.getString(DonmaiSlashCommandStringOptionName.Tags);
        let post = await this.api.random(tags);
        let count = await this.api.count(tags);

        if (DonmaiAPI.isError(post)) {
            if (tags && post.message === 'That record was not found.') {
                const autocomplete = await this.api.autocomplete(tags);
                if (!DonmaiAPI.isError(autocomplete)) {
                    if (!autocomplete.length) {
                        const replyOptions = this.createReplyBuilder(command, tags, post, count);
                        return await command.followUp(replyOptions);
                    }
                    const replyOptions = new DonmaiReplyBuilder(this.api, command).addDonmaiSuggestionsReply({ tags, autocomplete, command });
                    const message = await command.followUp(replyOptions);
                    const collector = Util.createComponentCollector(command.client, message);
                    return collector.once('collect', async (component: SelectMenuInteraction) => {
                        await component.deferUpdate();
                        tags = component.values.join('+');
                        post = await this.api.random(tags);
                        count = await this.api.count(tags);
                        const replyOptions = this.createReplyBuilder(command, tags, post, count);
                        const message = await component.editReply(replyOptions);
                        if (!DonmaiAPI.isError(post)) {
                            const collector = Util.createComponentCollector(command.client, message);
                            collector.on('collect', this.createCollectorFunction(tags, post, count, command));
                        }
                    });
                }
            }

            const replyOptions = this.createReplyBuilder(command, tags, post, count);
            return await command.followUp(replyOptions);
        }

        const replyOptions = new DonmaiReplyBuilder(this.api, command).addDonmaiImageReply(tags, post, count);
        const message = await command.followUp(replyOptions);
        const collector = Util.createComponentCollector(command.client, message);
        collector.on('collect', this.createCollectorFunction(tags, post, count, command));
    }

    private createReplyBuilder(command: ChatInputCommandInteraction, tags: string | null, post: DonmaiAPIPost | DonmaiAPIError, count: DonmaiAPICount): DonmaiReplyBuilder {
        if (!DonmaiAPI.isError(post)) return new DonmaiReplyBuilder(this.api, command).addDonmaiImageReply(tags, post, count);
        switch (post.message || 'The database timed out running your query.') {
            case 'You cannot search for more than 2 tags at a time.': return new DonmaiReplyBuilder(this.api, command).addDonmaiSuggestionsReply({ tags, command, autocomplete: [], message: `Sorry! You can only search up to \`2\` tags with a \`basic\` account 😦` });
            case 'You cannot search for more than 6 tags at a time.': return new DonmaiReplyBuilder(this.api, command).addDonmaiSuggestionsReply({ tags, command, autocomplete: [], message: `Sorry! You can only search up to \`6\` tags with a \`gold\` account 😦` });
            case 'You cannot search for more than 12 tags at a time.': return new DonmaiReplyBuilder(this.api, command).addDonmaiSuggestionsReply({ tags, command, autocomplete: [], message: `Sorry! You can only search up to \`12\` tags with a \`platinum\` account 😦` });
            case 'The database timed out running your query.':
            case 'That record was not found.': {
                return new DonmaiReplyBuilder(this.api, command).addDonmaiSuggestionsReply({ tags, command, autocomplete: [], message: post.message });
            }
            default: {
                console.warn(`[support](${this.api.subDomain}) Unknown api response details <${post.message}>`);
                return new DonmaiReplyBuilder(this.api, command).addDonmaiSuggestionsReply({ tags, command, autocomplete: [], message: post.message });
            }
        }
    }

    private createCollectorFunction(tags: string | null, post: DonmaiAPIPost, count: DonmaiAPICount, command: ChatInputCommandInteraction) {
        return async (component: MessageComponentInteraction) => {
            switch (component.customId) {
                case BooruMessageComponentId.Tags: {
                    const replyOptions = new DonmaiReplyBuilder(this.api, command).addDonmaiTagsReply(tags, post, count);
                    return await component.update(replyOptions);
                }
                case BooruMessageComponentId.Image: {
                    const replyOptions = new DonmaiReplyBuilder(this.api, command).addDonmaiImageReply(tags, post, count);
                    return await component.update(replyOptions);
                }
                case BooruMessageComponentId.Recycle: {
                    if (!Util.isAdminOrOwner(component, command)) {
                        const replyOptions = new DonmaiReplyBuilder(this.api, command).addAdminOrOwnerEmbed({ command, component });
                        return await component.reply(replyOptions);
                    }
                    await component.deferUpdate();
                    const recycled = await this.api.random(tags);
                    if (!DonmaiAPI.isError(recycled)) post = recycled;
                    const replyOptions = this.createReplyBuilder(command, tags, post, count);
                    return await component.editReply(replyOptions);
                }
                default: {
                    const replyOptions = new DonmaiReplyBuilder(this.api, command).addUnknownComponentEmbed({ component });
                    return await component.update(replyOptions);
                }
            }
        };
    }
}
