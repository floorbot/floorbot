import { CommonResponseFactory, BooruHandler, BooruHandlerReply } from '../../../..';
import { HandlerContext } from 'discord.js-commands';
import { InteractionReplyOptions } from 'discord.js';

export abstract class BooruResponseFactory extends CommonResponseFactory<BooruHandler> {

    constructor(handler: BooruHandler) {
        super(handler);
    }

    public abstract generateResponse(context: HandlerContext, query: string): Promise<BooruHandlerReply>

    public getWhitelistRecycleResponse(context: HandlerContext): InteractionReplyOptions {
        return this.handler.embedFactory.getWhitelistRecycleEmbed(context).toReplyOptions(true);
    }

    public getWhitelistSuggestionResponse(context: HandlerContext): InteractionReplyOptions {
        return this.handler.embedFactory.getWhitelistSuggestionEmbed(context).toReplyOptions(true);
    }
}
