import { ChatInputApplicationCommandData, CommandInteraction, GuildMember, Interaction, InteractionReplyOptions, Message, MessageComponentInteraction } from 'discord.js';
import { ChatInputHandler } from '../../discord/handler/abstracts/ChatInputHandler.js';
import { HandlerUtil } from '../../discord/handler/HandlerUtil.js';
import { HandlerReply } from '../../helpers/HandlerReply.js';
import { BooruSelectMenuID } from './BooruSelectMenu.js';
import { BooruButtonID } from './BooruButton.js';

export interface BooruHandlerOptions {
    readonly data: ChatInputApplicationCommandData
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

export abstract class BooruHandler extends ChatInputHandler {

    public readonly apiName: string;
    public readonly apiIcon: string;

    constructor(options: BooruHandlerOptions) {
        super({ group: 'Booru', global: false, ...options });
        this.apiName = options.apiName;
        this.apiIcon = options.apiIcon;
    }

    public abstract generateResponse(interaction: Interaction, query: string): Promise<InteractionReplyOptions>

    public async execute(command: CommandInteraction): Promise<any> {
        await command.deferReply();
        const query = (command.options.getString('tags') || command.options.getString('thread') || '').replace(/ /g, '+');
        const response = await this.generateResponse(command, query);
        const message = await command.followUp(response) as Message;
        const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 5 });
        collector.on('collect', this.createCollectorFunction(query, command));
        collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
    }

    private createCollectorFunction(query: string, source: Interaction) {
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
                            const member = component.member as GuildMember;
                            if (!HandlerUtil.isAdminOrOwner(member, source)) await component.reply(HandlerReply.createAdminOrOwnerReply(component));
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
                            collector.on('collect', this.createCollectorFunction(query, component));
                            collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
                            break;
                        }
                    }
                }
            } catch { }
        }
    }
}
