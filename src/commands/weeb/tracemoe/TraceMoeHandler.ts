import { ContextMenuHandler } from '../../../discord/handlers/abstracts/ContextMenuHandler.js';
import { HandlerButtonID } from '../../../discord/helpers/components/HandlerButton.js';
import { HandlerReplies } from '../../../discord/helpers/HandlerReplies.js';
import { TraceMoeAPI } from '../../../apis/tracemoe/TraceMoeAPI.js';
import { TraceMoeCommandData } from './TraceMoeCommandData.js';
import { HandlerUtil } from '../../../discord/HandlerUtil.js';
import { TraceMoeReplies } from './TraceMoeReplies.js';
import { ContextMenuInteraction } from 'discord.js';
import { Redis } from 'ioredis';

export class TraceMoeHandler extends ContextMenuHandler {

    private readonly tracemoe: TraceMoeAPI;
    private readonly replies: TraceMoeReplies;

    constructor(redis: Redis) {
        super({ group: 'Weeb', global: false, nsfw: false, data: TraceMoeCommandData });
        this.replies = new TraceMoeReplies();
        this.tracemoe = new TraceMoeAPI({ redis });
    }

    public async execute(contextMenu: ContextMenuInteraction<'cached'>): Promise<any> {
        await contextMenu.deferReply();

        const targetMessage = contextMenu.options.getMessage('message', true);
        const metadata = await HandlerUtil.probeMessage(targetMessage);
        if (!metadata) {
            const replyOptions = HandlerReplies.createMessageContentReply(contextMenu, 'trace moe');
            return contextMenu.followUp(replyOptions);
        }

        const res = await this.tracemoe.fetchTraceMoeData(metadata.url);
        if (res.error || !res.result[0]) {
            const replyOptions = this.replies.createTraceMoeErrorReply(contextMenu, res);
            return await contextMenu.followUp(replyOptions);
        }

        const pageData = { page: 0, pages: res.result.length };
        const replyOptions = this.replies.createTraceMoeReply(contextMenu, metadata, res.result[0], pageData);
        const message = await contextMenu.followUp(replyOptions);
        const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 5 });
        collector.on('collect', HandlerUtil.handleCollectorErrors(async component => {
            await component.reply(this.replies.createLoadingReply(contextMenu));
            if (component.customId === HandlerButtonID.NEXT_PAGE) pageData.page++;
            if (component.customId === HandlerButtonID.PREVIOUS_PAGE) pageData.page--;
            pageData.page = pageData.page % pageData.pages;
            pageData.page = pageData.page >= 0 ? pageData.page : pageData.pages + pageData.page;
            const result = res.result[pageData.page];
            if (!result) throw new Error('Trace Moe results do not have specified page');
            const replyOptions = this.replies.createTraceMoeReply(contextMenu, metadata, result, pageData);
            await component.editReply(replyOptions);
        }));
        collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
    }
}
