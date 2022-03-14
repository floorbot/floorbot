import { ChatInputApplicationCommandData, ChatInputCommandInteraction, Interaction, MessageComponentInteraction } from 'discord.js';
import { BooruComponentID, BooruPostData, BooruReplyBuilder } from './BooruReplyBuilder.js';
import { ResponseOptions } from '../../lib/discord/builders/ReplyBuilder.js';
import { ApplicationCommandHandler } from 'discord.js-handlers';
import { HandlerUtil } from '../../lib/discord/HandlerUtil.js';

export interface BooruChatInputHandlerOptions {
    readonly data: ChatInputApplicationCommandData;
    readonly nsfw: boolean;
}

export abstract class BooruChatInputHandler extends ApplicationCommandHandler<ChatInputApplicationCommandData> {

    public readonly nsfw: boolean;

    constructor(options: BooruChatInputHandlerOptions) {
        super(options.data);
        this.nsfw = options.nsfw;
    }

    public abstract fetchPostData(query: string): Promise<BooruPostData | string | null>;
    public abstract createTagsReply(source: Interaction, query: string, postData: BooruPostData | string | null): Promise<ResponseOptions>;
    public abstract createImageReply(source: Interaction, query: string, postData: BooruPostData | string | null): Promise<ResponseOptions>;

    public getCommandQuery(command: ChatInputCommandInteraction): string {
        const tags = command.options.getString('tags');
        const thread = command.options.getString('thread');
        return (tags || thread || '').replace(/ /g, '+');
    };

    public async run(command: ChatInputCommandInteraction<'cached'>): Promise<any> {
        if (this.nsfw && (command.channel && !HandlerUtil.isNSFW(command.channel))) {
            const replyOptions = new BooruReplyBuilder(command)
                .addNSFWChannelOnlyEmbed();
            return command.reply(replyOptions);
        } else {
            await command.deferReply();
            const query = this.getCommandQuery(command);
            const postData = await this.fetchPostData(query);
            const response = await this.createImageReply(command, query, postData);
            const message = await command.followUp(response);
            const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 5 });
            collector.on('collect', this.createCollectorFunction(query, postData, command));
            collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
        }
    }

    private createCollectorFunction(query: string, postData: BooruPostData | string | null, source: Interaction) {
        return HandlerUtil.handleCollectorErrors(
            async (component: MessageComponentInteraction<'cached'>) => {
                if (component.isSelectMenu()) {
                    switch (component.customId) {
                        case BooruComponentID.SUGGESTIONS: {
                            await component.deferUpdate();
                            query = component.values[0]!;
                            postData = await this.fetchPostData(query);
                            const replyOptions = await this.createImageReply(component, query, postData);
                            return await component.editReply(replyOptions);
                        }
                    }
                }
                if (component.isButton()) {
                    switch (component.customId) {
                        case BooruComponentID.RECYCLE: {
                            if (!HandlerUtil.isAdminOrOwner(component.member, source)) {
                                const replyOptions = new BooruReplyBuilder(component).addAdminOrOwnerEmbed();
                                return await component.reply(replyOptions);
                            }
                            await component.deferUpdate();
                            postData = await this.fetchPostData(query);
                            const replyOptions = await this.createImageReply(component, query, postData);
                            return await component.editReply(replyOptions);
                        }
                        case BooruComponentID.REPEAT: {
                            await component.deferReply();
                            const replyOptions = await this.createImageReply(component, query, postData);
                            const message = await component.followUp(replyOptions);
                            const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 10 });
                            collector.on('collect', this.createCollectorFunction(query, postData, component));
                            collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
                            break;
                        }
                        case BooruComponentID.TAGS: {
                            const replyOptions = await this.createTagsReply(component, query, postData);
                            return await component.update(replyOptions);
                        }
                        case BooruComponentID.IMAGE: {
                            const replyOptions = await this.createImageReply(component, query, postData);
                            return await component.update(replyOptions);
                        }
                    }
                }
            }
        );
    }
}
