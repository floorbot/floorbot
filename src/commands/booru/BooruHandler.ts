import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions, Message, MessageComponentInteraction, Util } from 'discord.js';
import { HandlerReply } from '../../components/HandlerReply';
import { BooruSelectMenuID } from './BooruSelectMenu';
import { HandlerContext } from '../../discord/Util';
import { BaseHandler } from '../BaseHandler';
import { BooruButtonID } from './BooruButton';

export interface BooruHandlerOptions {
    readonly data: ApplicationCommandData
    readonly nsfw: boolean,
    readonly id: string,
    readonly apiName: string,
    readonly apiIcon: string
}

export interface BooruSuggestionData {
    readonly suggestions: Array<{
        readonly name: string,
        readonly count: number
    }>,
    readonly tags: string,
    readonly url404: string | null
}

export abstract class BooruHandler extends BaseHandler {

    public readonly apiName: string;
    public readonly apiIcon: string;

    constructor(options: BooruHandlerOptions) {
        super({ group: 'Booru', global: false, ...options });
        this.apiName = options.apiName;
        this.apiIcon = options.apiIcon;
    }

    public abstract generateResponse(context: HandlerContext, query: string): Promise<InteractionReplyOptions>

    public async execute(command: CommandInteraction): Promise<any> {
        await command.deferReply();
        const query = (command.options.getString('tags') || command.options.getString('thread') || '').replace(/ /g, '+');
        const response = await this.generateResponse(command, query);
        const message = await command.followUp(response) as Message;
        const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 5 });
        collector.on('collect', this.createCollectorFunction(query));
        collector.on('end', Util.deleteComponentsOnEnd(message));
    }

    private createCollectorFunction(query: string) {
        return async (component: MessageComponentInteraction) => {
            try {
                if (component.isSelectMenu()) {
                    switch (component.customId) {
                        case BooruSelectMenuID.SUGGESTIONS: {
                            await component.deferUpdate();
                            query = component.values[0]!;
                            const replyOptions = await this.generateResponse(component, query);
                            await component.editReply(replyOptions);
                            break;
                        }
                    }
                }
                if (component.isButton()) {
                    switch (component.customId) {
                        case BooruButtonID.RECYCLE: {
                            if (!Util.isAdminOrOwner(component)) await component.reply(HandlerReply.createAdminOrOwnerReply(component));
                            await component.deferUpdate();
                            const replyOptions = await this.generateResponse(component, query);
                            await component.editReply(replyOptions);
                            break;
                        }
                        case BooruButtonID.REPEAT: {
                            await component.deferReply();
                            const replyOptions = await this.generateResponse(component, query);
                            const message = await component.followUp(replyOptions) as Message;
                            const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 10 })
                            collector.on('collect', this.createCollectorFunction(query));
                            collector.on('end', Util.deleteComponentsOnEnd(message));
                            break;
                        }
                    }
                }
            } catch { }
        }
    }
}
