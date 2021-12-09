import { ContextMenuInteraction, Interaction, InteractionReplyOptions, Message, MessageActionRow } from "discord.js";
import { TraceMoeResponse, TraceMoeResult } from "../../../apis/tracemoe/TraceMoeAPI.js";
import { HandlerButton } from '../../../discord/helpers/components/HandlerButton.js';
import { HandlerEmbed } from '../../../discord/helpers/components/HandlerEmbed.js';
import { HandlerReplies } from "../../../discord/helpers/HandlerReplies.js";
import { HandlerUtil } from "../../../discord/HandlerUtil.js";
import humanizeDuration from 'humanize-duration';
import { ProbeResult } from "probe-image-size";

export interface TraceMoePageData {
    page: number,
    pages: number;
}

export class TraceMoeReplies extends HandlerReplies {

    public override createEmbedTemplate(context: Interaction | Message, pageData?: TraceMoePageData): HandlerEmbed {
        const embed = super.createEmbedTemplate(context);
        if (pageData) embed.setFooter(`${pageData.page + 1}/${pageData.pages} - Powered by Trace Moe`);
        else embed.setFooter(`Powered by Trace Moe`);
        return embed;
    }

    public createLoadingReply(contextMenu: ContextMenuInteraction): InteractionReplyOptions {
        const embed = this.createEmbedTemplate(contextMenu)
            .setTitle('Trace Moe Loading...')
            .setDescription('*Please wait while I upload the scene!*');
        return { embeds: [embed], components: [], attachments: [], files: [] };
    }

    public createTraceMoeErrorReply(context: Interaction | Message, res: TraceMoeResponse): InteractionReplyOptions {
        console.error('[tracemoe] There was a tracemoe error...', res);
        const attachment = this.getAvatar('1-3');
        const embed = this.createEmbedTemplate(context)
            .setTitle('Trace Moe Error')
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription(res.error || 'Unknown reason...');
        return { embeds: [embed], files: [attachment] };
    }

    public createTraceMoeReply(context: Interaction | Message, metadata: ProbeResult, result: TraceMoeResult, pageData: TraceMoePageData): InteractionReplyOptions {
        const anilistID = typeof result.anilist === 'string' ? result.anilist : result.anilist.id;
        const embed = this.createEmbedTemplate(context, pageData)
            .setTitle(typeof result.anilist === 'string' ? result.filename : result.anilist.title.romaji)
            .setURL(`https://anilist.co/anime/${anilistID}`)
            .setThumbnail(metadata.url)
            .setDescription([
                `Episode: **${result.episode}**`,
                `Similarity: **${HandlerUtil.formatDecimal(result.similarity * 100, 2)}%**`,
                `Scene Time: **${humanizeDuration(Math.round(result.from) * 1000)}**`
            ]);
        const attachment = this.createAttachmentTemplate(`${result.video}&size=l`);
        const actionRow = new MessageActionRow().addComponents([
            HandlerButton.createViewOnlineButton(`https://anilist.co/anime/${anilistID}`),
            HandlerButton.createPreviousPageButton(),
            HandlerButton.createNextPageButton(),
            new HandlerButton().setStyle('SECONDARY').setCustomId('anilist').setLabel('AniList')
        ]);

        return { embeds: [embed], components: [actionRow], attachments: [], files: [attachment] };
    }
}
