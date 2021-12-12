import { TraceMoeResult } from "../apis/tracemoe/interfaces/TraceMoeResult.js";
import { AttachmentBuilder } from "../discord/builders/AttachmentBuilder.js";
import { ActionRowBuilder } from "../discord/builders/ActionRowBuilder.js";
import { ButtonBuilder } from "../discord/builders/ButtonBuilder.js";
import { EmbedBuilder } from "../discord/builders/EmbedBuilder.js";
import { ReplyBuilder } from "../discord/builders/ReplyBuilder.js";
import { HandlerUtil } from "../discord/HandlerUtil.js";
import humanizeDuration from "humanize-duration";
import { ProbeResult } from "probe-image-size";
import { Constants } from "discord.js";
import { Media } from "../apis/anilist/AniListAPI.js";

const { MessageButtonStyles } = Constants;

export interface TraceMoeReplyBuilderPage { page: number, pages: number; }

export enum TraceMoeComponentID { ANILIST = 'anilist' }

export class TraceMoeReplyBuilder extends ReplyBuilder {

    protected override createEmbedBuilder(pageData?: TraceMoeReplyBuilderPage): EmbedBuilder {
        const embed = super.createEmbedBuilder();
        const iconURL = 'https://trace.moe/favicon.png';
        if (pageData) {
            const page = HandlerUtil.resolvePage(pageData.page, pageData.pages);
            embed.setFooter(`${page + 1}/${pageData.pages} - Powered by Trace Moe`, iconURL);
        } else {
            embed.setFooter(`Powered by Trace Moe`, iconURL);
        }
        return embed;
    }

    public addTraceMoeEmbed(metadata: ProbeResult, result: TraceMoeResult, media: Media | null, pageData: TraceMoeReplyBuilderPage): this {
        const anilistID = typeof result.anilist === 'number' ? result.anilist : result.anilist.id;
        const title = media?.title?.romaji || (typeof result.anilist === 'number' ? result.filename : result.anilist.title.romaji);
        const embed = this.createEmbedBuilder(pageData)
            .setTitle(title)
            .setURL(`https://anilist.co/anime/${anilistID}`)
            .setThumbnail(metadata.url)
            .setDescription([
                `Episode: **${result.episode}**`,
                `Similarity: **${HandlerUtil.formatDecimal(result.similarity * 100, 2)}%**`,
                `Scene Time: **${humanizeDuration(Math.round(result.from) * 1000)}**`
            ]);
        return this.addEmbed(embed);
    }

    public addTraceMoeLoadingEmbed(): this {
        const embed = this.createEmbedBuilder()
            .setTitle('Trace Moe Loading...')
            .setDescription('*Please wait while I upload the scene!*');
        return this.addEmbed(embed);
    }

    public addTraceMoePageActionRow(result: TraceMoeResult, pageData: TraceMoeReplyBuilderPage): this {
        const anilistID = typeof result.anilist === 'number' ? result.anilist : result.anilist.id;
        const url = `https://anilist.co/anime/${anilistID}`;
        const anilistButton = new ButtonBuilder()
            .setLabel('AniList')
            .setCustomId(TraceMoeComponentID.ANILIST)
            .setStyle(MessageButtonStyles.SUCCESS);
        const actionRow = new ActionRowBuilder();
        actionRow.addViewOnlineButton(url);
        actionRow.addPreviousPageButton(undefined, pageData.pages <= 1);
        actionRow.addNextPageButton(undefined, pageData.pages <= 1);
        actionRow.addComponents(anilistButton);
        return this.addActionRow(actionRow);
    }

    public addTraceMoeFile(result: TraceMoeResult): this {
        const attachment = new AttachmentBuilder(`${result.video}&size=l`);
        return this.addFile(attachment);
    }
}
