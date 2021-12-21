import { ChatInputApplicationCommandData, CommandInteraction, GuildMember, Interaction, InteractionReplyOptions, Message, MessageComponentInteraction } from 'discord.js';
import { ChatInputHandler } from '../../lib/discord/handlers/abstracts/ChatInputHandler.js';
import { ReplyBuilder } from '../../lib/discord/builders/ReplyBuilder.js';
import { HandlerUtil } from '../../lib/discord/HandlerUtil.js';
import { BooruComponentID } from './BooruReplyBuilder.js';

export interface BooruHandlerOptions {
    readonly data: ChatInputApplicationCommandData;
    readonly nsfw: boolean;
}

export interface BooruSuggestionData {
    readonly suggestions: {
        readonly name: string;
        readonly count: number;
    }[];
    readonly tags: string;
    readonly url404: string | null;
}

export abstract class BooruHandler extends ChatInputHandler {

    constructor(options: BooruHandlerOptions) {
        super({ group: 'Booru', global: false, ...options });
    }

    public abstract generateResponse(interaction: Interaction, query: string): Promise<InteractionReplyOptions>;

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
        return HandlerUtil.handleCollectorErrors(async (component: MessageComponentInteraction) => {
            if (component.isSelectMenu()) {
                switch (component.customId) {
                    case BooruComponentID.SUGGESTIONS: {
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
                    case BooruComponentID.RECYCLE: {
                        const member = component.member as GuildMember;
                        if (!HandlerUtil.isAdminOrOwner(member, source)) {
                            const replyOptions = new ReplyBuilder(component).addAdminOrOwnerEmbed();
                            return await component.reply(replyOptions);
                        }
                        await component.deferUpdate();
                        const replyOptions = await this.generateResponse(component, query);
                        await component.editReply(replyOptions);
                        break;
                    }
                    case BooruComponentID.REPEAT: {
                        await component.deferReply();
                        const replyOptions = await this.generateResponse(component, query);
                        const message = await component.followUp(replyOptions) as Message;
                        const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 10 });
                        collector.on('collect', this.createCollectorFunction(query, component));
                        collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
                        break;
                    }
                }
            }
        });
    }
}
