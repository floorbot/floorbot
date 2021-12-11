import { ContextMenuHandler } from '../../../discord/handlers/abstracts/ContextMenuHandler.js';
import { HandlerButton, HandlerButtonID } from '../../../discord/helpers/components/HandlerButton.js';
import { HandlerReplies } from '../../../discord/helpers/HandlerReplies.js';
import { TraceMoeAPI } from '../../../apis/tracemoe/TraceMoeAPI.js';
// import { AniListAPI } from '../../../apis/anilist/AniListAPI.js';
import { TraceMoeCommandData } from './TraceMoeCommandData.js';
import { HandlerUtil } from '../../../discord/HandlerUtil.js';
import { TraceMoeReplies } from './TraceMoeReplies.js';
import { ContextMenuInteraction } from 'discord.js';
import { Redis } from 'ioredis';
// import path from 'path';
// import fs from 'fs';
import { ActionRowBuilder } from '../../../discord/builders/ActionRowBuilder.js';
import { AniListReplyBuilder } from '../../../builders/AniListReplyBuilder.js';

export class TraceMoeHandler extends ContextMenuHandler {

    // private readonly anilist: AniListAPI;
    private readonly tracemoe: TraceMoeAPI;
    private readonly replies: TraceMoeReplies;

    constructor(redis: Redis) {
        super({ group: 'Weeb', global: false, nsfw: false, data: TraceMoeCommandData });
        this.replies = new TraceMoeReplies();
        // this.anilist = new AniListAPI({ redis });
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
        let result = res.result[0];
        if (res.error || !result) {
            const replyOptions = this.replies.createTraceMoeErrorReply(contextMenu, res);
            return await contextMenu.followUp(replyOptions);
        }

        const pageData = { page: 0, pages: res.result.length };
        const replyOptions = this.replies.createTraceMoeReply(contextMenu, metadata, result, pageData);
        const message = await contextMenu.followUp(replyOptions);
        const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 5 });
        collector.on('collect', HandlerUtil.handleCollectorErrors(async component => {
            if (component.customId === 'tracemoe') {
                await component.deferUpdate();
                const replyOptions = this.replies.createTraceMoeReply(contextMenu, metadata, result!, pageData);
                return await component.editReply(replyOptions);
            }
            if (component.customId === 'anilist') {
                await component.deferUpdate();
                // const anilistID = typeof result!.anilist === 'string' ? result!.anilist : result!.anilist.id;
                // const query = fs.readFileSync(`${path.resolve()}/res/queries/media_page.gql`, 'utf8');
                // const anilistRes = await this.anilist.request(query, { id: parseInt(anilistID.toString()), page: 1 });
                const replyOptions = new AniListReplyBuilder(contextMenu)
                    .addActionRow(new ActionRowBuilder()
                        .addComponents(new HandlerButton().setStyle('SECONDARY').setCustomId('tracemoe').setLabel('Trace Moe')));
                return await component.editReply(replyOptions);
            }
            await component.update(this.replies.createLoadingReply(contextMenu));
            if (component.customId === HandlerButtonID.NEXT_PAGE) pageData.page++;
            if (component.customId === HandlerButtonID.PREVIOUS_PAGE) pageData.page--;
            pageData.page = pageData.page % pageData.pages;
            pageData.page = pageData.page >= 0 ? pageData.page : pageData.pages + pageData.page;
            result = res.result[pageData.page];
            if (!result) throw new Error('Trace Moe results do not have specified page');
            const replyOptions = this.replies.createTraceMoeReply(contextMenu, metadata, result, pageData);
            return await component.editReply(replyOptions);
        }));
        collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
    }
}
