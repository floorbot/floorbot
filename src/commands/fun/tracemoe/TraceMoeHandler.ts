import { ContextMenuHandler } from '../../../discord/handlers/abstracts/ContextMenuHandler.js';
import { HandlerReplies } from '../../../discord/helpers/HandlerReplies.js';
import { TraceMoeAPI } from '../../../apis/tracemoe/TraceMoeAPI.js';
import { TraceMoeCommandData } from './TraceMoeCommandData.js';
import { HandlerUtil } from '../../../discord/HandlerUtil.js';
import { HandlerButtonID } from '../../../discord/helpers/components/HandlerButton.js';
import { TraceMoeReplies } from './TraceMoeReplies.js';
import { Message, ContextMenuInteraction } from 'discord.js';

export class TraceMoeHandler extends ContextMenuHandler {

    private readonly tracemoe: TraceMoeAPI;
    private readonly replies: TraceMoeReplies;

    constructor() {
        super({ group: 'Fun', global: false, nsfw: false, data: TraceMoeCommandData });
        this.replies = new TraceMoeReplies();
        this.tracemoe = new TraceMoeAPI();
    }

    public async execute(contextMenu: ContextMenuInteraction<'cached'>): Promise<any> {
        await contextMenu.deferReply();
        let page = 0;
        const targetMessage = contextMenu.options.getMessage('message', true);
        const metadata = await HandlerUtil.probeMessage(targetMessage);
        if (!metadata) {
            const replyOptions = HandlerReplies.createMessageContentReply(contextMenu, 'trace moe');
            return contextMenu.followUp(replyOptions);
        }
        const result = await this.tracemoe.fetchTraceMoeData(metadata.url);
        const replyOptions = this.replies.createCurrentReply(contextMenu, result, page);
        const message = await contextMenu.followUp(replyOptions) as Message;
        const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 5 });
        collector.on('collect', HandlerUtil.handleCollectorErrors(async component => {
            await component.deferUpdate();
            if (component.customId === HandlerButtonID.NEXT_PAGE) page++;
            if (component.customId === HandlerButtonID.PREVIOUS_PAGE) page--;
            page = page % result.length;
            page = page >= 0 ? page : result.length + page;
            const replyOptions = this.replies.createCurrentReply(contextMenu, result, page);
            await component.editReply(replyOptions);
        }));
        collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
    }
}
