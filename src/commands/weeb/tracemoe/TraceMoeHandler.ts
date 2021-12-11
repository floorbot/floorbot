import { ContextMenuHandler } from '../../../discord/handlers/abstracts/ContextMenuHandler.js';
import { HandlerButton, HandlerButtonID } from '../../../discord/helpers/components/HandlerButton.js';
import { HandlerReplies } from '../../../discord/helpers/HandlerReplies.js';
import { TraceMoeAPI } from '../../../apis/tracemoe/TraceMoeAPI.js';
// import { AniListAPI } from '../../../apis/anilist/AniListAPI.js';
import { TraceMoeCommandData } from './TraceMoeCommandData.js';
import { HandlerUtil } from '../../../discord/HandlerUtil.js';
import { ContextMenuInteraction } from 'discord.js';
import { Redis } from 'ioredis';
// import path from 'path';
// import fs from 'fs';
import { ActionRowBuilder } from '../../../discord/builders/ActionRowBuilder.js';
import { AniListReplyBuilder } from '../../../builders/AniListReplyBuilder.js';
import { TraceMoeReplyBuilder } from '../../../builders/TraceMoeReplyBuilder.js';

export class TraceMoeHandler extends ContextMenuHandler {

    // private readonly anilist: AniListAPI;
    private readonly tracemoe: TraceMoeAPI;

    constructor(redis: Redis) {
        super({ group: 'Weeb', global: false, nsfw: false, data: TraceMoeCommandData });
        // this.anilist = new AniListAPI({ redis });
        this.tracemoe = new TraceMoeAPI({ redis });
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

        const res = await this.tracemoe.fetchTraceMoeData(metadata.url);
        const results = res.result;
        let result = res.result[0];
        if (res.error || !result) {
            return await contextMenu.followUp(new TraceMoeReplyBuilder(contextMenu).addUnexpectedErrorEmbed(res.error));
        }
        if (!HandlerUtil.isNonEmptyArray(results)) {
            return await contextMenu.followUp(new TraceMoeReplyBuilder(contextMenu).addNotFoundEmbed());
        }

        // const pageData = { page: 0, pages: res.result.length };
        const replyOptions = new TraceMoeReplyBuilder(contextMenu)
            .addTraceMoeEmbed(metadata, results, page)
            .addTraceMoePageActionRow(results, page)
            .removeAttachments()
            .addTraceMoeFile(results, page);
        // const replyOptions = this.replies.createTraceMoeReply(contextMenu, metadata, result, pageData);
        const message = await contextMenu.followUp(replyOptions);
        const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 5 });
        collector.on('collect', HandlerUtil.handleCollectorErrors(async component => {
            if (component.customId === 'tracemoe') {
                await component.deferUpdate();
                const replyOptions = new TraceMoeReplyBuilder(contextMenu)
                    .addTraceMoeEmbed(metadata, results, page)
                    .addTraceMoePageActionRow(results, page)
                    .removeAttachments()
                    .addTraceMoeFile(results, page);
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
            await component.update(new TraceMoeReplyBuilder(contextMenu).addTraceMoeLoadingEmbed());
            if (component.customId === HandlerButtonID.NEXT_PAGE) page++;
            if (component.customId === HandlerButtonID.PREVIOUS_PAGE) page--;
            result = res.result[page];
            if (!result) throw new Error('Trace Moe results do not have specified page');
            const replyOptions = new TraceMoeReplyBuilder(contextMenu)
                .addTraceMoeEmbed(metadata, results, page)
                .addTraceMoePageActionRow(results, page)
                .removeAttachments()
                .addTraceMoeFile(results, page);
            return await component.editReply(replyOptions);
        }));
        collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
    }
}
