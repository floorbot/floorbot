import { ContextMenuCommandInteraction, Interaction, MessageApplicationCommandData } from 'discord.js';
import { TraceMoeAPI, TraceMoeResult } from '../../../lib/apis/tracemoe/TraceMoeAPI.js';
import { PageableComponentID } from '../../../helpers/mixins/PageableMixins.js';
import { TraceMoeMessageCommandData } from './TraceMoeMessageCommandData.js';
import { AniListAPI, Media } from '../../../lib/apis/anilist/AniListAPI.js';
import { HandlerUtil } from '../../../lib/discord/HandlerUtil.js';
import { TraceMoeReplyBuilder } from './TraceMoeReplyBuilder.js';
import { ApplicationCommandHandler } from 'discord.js-handlers';
import { Pageable } from '../../../helpers/Pageable.js';
import { Redis } from 'ioredis';
import path from 'path';
import fs from 'fs';

export class TraceMoeMessageHandler extends ApplicationCommandHandler<MessageApplicationCommandData> {

    private readonly tracemoe: TraceMoeAPI;
    private readonly anilist: AniListAPI;

    constructor(redis: Redis) {
        super(TraceMoeMessageCommandData);
        this.tracemoe = new TraceMoeAPI({ redis });
        this.anilist = new AniListAPI({ redis });
    }

    public async run(contextMenu: ContextMenuCommandInteraction<'cached'>): Promise<any> {
        await contextMenu.deferReply();

        // Get the image url if there is one
        const targetMessage = contextMenu.options.getMessage('message', true);
        const metadata = await HandlerUtil.probeMessage(targetMessage);
        if (!metadata) return contextMenu.followUp(new TraceMoeReplyBuilder(contextMenu).addMissingContentEmbed('trace moe'));

        // Fetch the trace moe results and check the contents
        const res = await this.tracemoe.fetchTraceMoeData(metadata.url);
        if (res.error) return contextMenu.followUp(new TraceMoeReplyBuilder(contextMenu).addUnexpectedErrorEmbed(res.error));
        if (!Pageable.isNonEmptyArray(res.result)) return contextMenu.followUp(new TraceMoeReplyBuilder(contextMenu).addNotFoundEmbed());
        const pageable = new Pageable(res.result);

        // Create and send the first reply
        let result = pageable.getPageFirst();
        let media = await this.requestAnime(result);
        const replyOptions = new TraceMoeReplyBuilder(contextMenu)
            .addTraceMoeEmbed(metadata, pageable, media)
            .addPageActionRow(this.getURL(result));
        if (this.canPostVideo(contextMenu, media)) replyOptions.addTraceMoeFile(result);
        const message = await contextMenu.followUp(replyOptions);

        // Add interaction collector and handle buttons
        const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 5 });
        collector.on('collect', HandlerUtil.handleCollectorErrors(async component => {

            // Send a loading embed and followup with next/previous result
            await component.update(new TraceMoeReplyBuilder(contextMenu).addTraceMoeLoadingEmbed());
            if (component.customId === PageableComponentID.NEXT_PAGE) pageable.page++;
            if (component.customId === PageableComponentID.PREVIOUS_PAGE) pageable.page--;
            result = pageable.getPageFirst();
            media = await this.requestAnime(result);
            const replyOptions = new TraceMoeReplyBuilder(contextMenu)
                .addTraceMoeEmbed(metadata, pageable, media)
                .addPageActionRow(this.getURL(result))
                .clearAttachments();
            if (this.canPostVideo(component, media)) replyOptions.addTraceMoeFile(result);
            return await component.editReply(replyOptions);
        }));
        collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
    }

    private getURL(result: TraceMoeResult): string {
        const anilistID = typeof result.anilist === 'number' ? result.anilist : result.anilist.id;
        return `https://anilist.co/anime/${anilistID}`;
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
