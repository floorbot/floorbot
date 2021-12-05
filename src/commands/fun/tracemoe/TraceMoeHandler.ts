import { ContextMenuHandler } from '../../../discord/handlers/abstracts/ContextMenuHandler.js';
import { HandlerReplies } from '../../../discord/helpers/HandlerReplies.js';
import { TraceMoeAPI } from '../../../apis/tracemoe/TraceMoeAPI.js';
import { TraceMoeCommandData } from './TraceMoeCommandData.js';
import { HandlerUtil } from '../../../discord/HandlerUtil.js';
import { TraceMoeReplies } from './TraceMoeReplies.js';
import { ContextMenuInteraction } from 'discord.js';

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
        const targetMessage = contextMenu.options.getMessage('message', true);
        const metadata = await HandlerUtil.probeMessage(targetMessage);
        if (!metadata) {
            const replyOptions = HandlerReplies.createMessageContentReply(contextMenu, 'trace moe');
            return contextMenu.followUp(replyOptions);
        }
        const result = await this.tracemoe.fetchTraceMoeData(metadata.url);
        const replyOptions = this.replies.createCurrentReply(contextMenu, result);
        await contextMenu.followUp(replyOptions);
    }
}
