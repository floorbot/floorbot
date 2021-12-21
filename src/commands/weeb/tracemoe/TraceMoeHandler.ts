import { ContextMenuHandler } from '../../../lib/discord/handlers/abstracts/ContextMenuHandler.js';
import { TraceMoeAPI, TraceMoeResult } from '../../../lib/apis/tracemoe/TraceMoeAPI.js';
import { ComponentID } from '../../../lib/discord/builders/ActionRowBuilder.js';
import { AniListAPI, Media } from '../../../lib/apis/anilist/AniListAPI.js';
import { HandlerUtil } from '../../../lib/discord/HandlerUtil.js';
import { TraceMoeReplyBuilder } from './TraceMoeReplyBuilder.js';
import { ContextMenuInteraction, Interaction } from 'discord.js';
import { TraceMoeCommandData } from './TraceMoeCommandData.js';
import { Redis } from 'ioredis';
import path from 'path';
import fs from 'fs';

export class TraceMoeHandler extends ContextMenuHandler {

    // private readonly anilist: AniListAPI;
    private readonly tracemoe: TraceMoeAPI;
    private readonly anilist: AniListAPI;

    constructor(redis: Redis) {
        super({ group: 'Weeb', global: false, nsfw: false, data: TraceMoeCommandData });
        // this.anilist = new AniListAPI({ redis });
        this.tracemoe = new TraceMoeAPI({ redis });
        this.anilist = new AniListAPI({ redis });
    }

    public async execute(contextMenu: ContextMenuInteraction<'cached'>): Promise<any> {
        await contextMenu.deferReply();

        // Get the image url if there is one
        const targetMessage = contextMenu.options.getMessage('message', true);
        const metadata = await HandlerUtil.probeMessage(targetMessage);
        if (!metadata) return contextMenu.followUp(new TraceMoeReplyBuilder(contextMenu).addMissingContentEmbed('trace moe'));

        // Fetch the trace moe results and check the contents
        const res = await this.tracemoe.fetchTraceMoeData(metadata.url);
        if (res.error) return contextMenu.followUp(new TraceMoeReplyBuilder(contextMenu).addUnexpectedErrorEmbed(res.error));
        if (!HandlerUtil.isNonEmptyArray(res.result)) return contextMenu.followUp(new TraceMoeReplyBuilder(contextMenu).addNotFoundEmbed());

        // Create and send the first reply
        const pageData = { page: 0, pages: res.result.length };
        let result = HandlerUtil.resolveArrayPage(res.result, pageData.page);
        let media = await this.requestAnime(result);

        const replyOptions = new TraceMoeReplyBuilder(contextMenu)
            // .setContent(result.video) // This does not embed...
            .addTraceMoeEmbed(metadata, result, media, pageData)
            .addTraceMoePageActionRow(result, pageData);
        if (this.canPostVideo(contextMenu, media)) replyOptions.addTraceMoeFile(result);
        const message = await contextMenu.followUp(replyOptions);

        // Add interaciton collector and handle buttons
        const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 5 });
        collector.on('collect', HandlerUtil.handleCollectorErrors(async component => {

            // Send a loading embed and folloup with next/previous result
            await component.update(new TraceMoeReplyBuilder(contextMenu).addTraceMoeLoadingEmbed());
            if (component.customId === ComponentID.NEXT_PAGE) pageData.page++;
            if (component.customId === ComponentID.PREVIOUS_PAGE) pageData.page--;
            if (!HandlerUtil.isNonEmptyArray(res.result)) return contextMenu.followUp(new TraceMoeReplyBuilder(contextMenu).addNotFoundEmbed());
            result = HandlerUtil.resolveArrayPage(res.result, pageData.page);
            media = await this.requestAnime(result);
            const replyOptions = new TraceMoeReplyBuilder(contextMenu)
                // .setContent(result.video) // This does not embed...
                .addTraceMoeEmbed(metadata, result, media, pageData)
                .addTraceMoePageActionRow(result, pageData)
                .clearAttachments();
            if (this.canPostVideo(component, media)) replyOptions.addTraceMoeFile(result);
            return await component.editReply(replyOptions);
        }));
        collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
    }

    private canPostVideo(interaction: Interaction<any>, media?: Media): boolean {
        const channelNSFW = (interaction.channel && HandlerUtil.isNSFW(interaction.channel)) ?? false;
        const mediaNSFW = media?.isAdult ?? true;
        return !mediaNSFW || channelNSFW;
    }

    private async requestAnime(result: TraceMoeResult): Promise<Media | undefined> {
        const query = fs.readFileSync(`${path.resolve()}/res/queries/media_page.gql`, 'utf8');
        const id = typeof result.anilist === 'number' ? result.anilist : result.anilist.id;
        const res = await this.anilist.request(query, { id: id });
        return res.data.Page?.media?.[0];
    }
}
