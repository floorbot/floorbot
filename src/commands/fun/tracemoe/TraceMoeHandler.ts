import { ContextMenuInteraction, Message, Interaction, InteractionReplyOptions } from 'discord.js';
import { ContextMenuHandler } from '../../../discord/handlers/abstracts/ContextMenuHandler.js';
import { HandlerReplies } from '../../../discord/helpers/HandlerReplies.js';
import { TraceMoeCommandData } from './TraceMoeCommandData.js';
import { TraceMoeAPI } from './api/TraceMoeAPI.js';
import { TraceMoeEmbed } from './components/TraceMoeEmbed.js'
import { TraceMoeData } from './api/interfaces/TraceMoeData.js'

export class TraceMoeHandler extends ContextMenuHandler {

    private readonly tracemoe: TraceMoeAPI;

    constructor() {
        super({ group: 'Fun', global: false, nsfw: false, data: TraceMoeCommandData });
        this.tracemoe = new TraceMoeAPI();
    }

    public async execute(contextMenu: ContextMenuInteraction): Promise<any> {
        const origMessage = contextMenu.options.getMessage('message', true) as Message;
        if (!origMessage.attachments.first()!.url) return contextMenu.reply(HandlerReplies.createMessageContentReply(contextMenu, 'trace moe'));
        // console.log(origMessage);
        await contextMenu.deferReply();
        const result = await this.tracemoe.contextClick(origMessage) as TraceMoeData;
        const replyOptions = this.createCurrentResponse(contextMenu, origMessage, result);
        console.log(result.result[0]);
        await contextMenu.followUp(replyOptions);
    }

    private createCurrentResponse(interaction: Interaction, message: Message, result: TraceMoeData ): InteractionReplyOptions {
        const embed = TraceMoeEmbed.getCurrentEmbed(interaction, message, result);
        return { embeds: [embed] };
    }
}
