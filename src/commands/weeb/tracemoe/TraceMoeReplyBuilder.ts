import { FuzzyDate, Media, MediaRankType } from "../../../lib/apis/anilist/AniListAPI.js";
import { TraceMoeResult } from "../../../lib/apis/tracemoe/interfaces/TraceMoeResult.js";
import { AttachmentBuilder } from "../../../lib/discord/builders/AttachmentBuilder.js";
import { PageableActionRowBuilder } from "../../../helpers/mixins/PageableMixins.js";
import { EmbedBuilder } from "../../../lib/discord/builders/EmbedBuilder.js";
import { ReplyBuilder } from "../../../lib/discord/builders/ReplyBuilder.js";
import { HandlerUtil } from "../../../lib/discord/HandlerUtil.js";
import humanizeDuration from "humanize-duration";
import { ProbeResult } from "probe-image-size";
import { DateTime } from "luxon";

export interface TraceMoeReplyBuilderPage { page: number, pages: number; }

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

    public addTraceMoeEmbed(metadata: ProbeResult, result: TraceMoeResult, media?: Media, pageData?: TraceMoeReplyBuilderPage): this {
        const anilistID = typeof result.anilist === 'number' ? result.anilist : result.anilist.id;
        const title = media?.title?.romaji || (typeof result.anilist === 'number' ? result.filename : result.anilist.title.romaji);
        const nsfw = media?.isAdult || false;
        const embed = this.createEmbedBuilder(pageData)
            .setTitle(`${title} ${nsfw ? '(18+)' : ''}`)
            .setURL(`https://anilist.co/anime/${anilistID}`)
            .setImage(metadata.url)
            .setDescription([
                `Episode: **${result.episode ?? '1/1'}**`,
                `Similarity: **${HandlerUtil.formatDecimal(result.similarity * 100, 2)}%**`,
                `Scene Time: **${humanizeDuration(Math.round(result.from) * 1000)}**`
            ]);
        if (media) {
            const popularity = media.rankings ? media.rankings.find(ranking => ranking.allTime && ranking.type === MediaRankType.POPULAR) : undefined;
            const rated = media.rankings ? media.rankings.find(ranking => ranking.allTime && ranking.type === MediaRankType.RATED) : undefined;
            const nextAiring = media.nextAiringEpisode;
            const mainStudioEdge = media.studios && media.studios.edges ? media.studios.edges.find(edge => edge.isMain) : null;
            const mainStudio = mainStudioEdge ? mainStudioEdge.node ?? null : null;
            const startDate = media.startDate ? TraceMoeReplyBuilder.getFuzzyDateString(media.startDate) : null;
            const endDate = media.endDate ? TraceMoeReplyBuilder.getFuzzyDateString(media.endDate) : null;
            const trailerUrl = media.trailer ? (
                media.trailer.site === 'youtube' ? `https://www.youtube.com/watch?v=${media.trailer.id}` : (
                    media.trailer.site === 'dailymotion' ? `https://www.dailymotion.com/video/${media.trailer.id}` : null
                )
            ) : null;
            const lines = [
                ...(media.favourites ? [`Favourites: **${HandlerUtil.formatCommas(media.favourites)}**`] : []),
                ...(media.status ? [`Status: ** ${HandlerUtil.capitalizeString(media.status)}** `] : []),
                ...(media.nextAiringEpisode ? [`Airing: ** <t:${Math.round(new DateTime().plus({ seconds: media.nextAiringEpisode.timeUntilAiring }).toSeconds())}: R >** `] : []),
                `Score: ** ${rated ? `(#${rated.rank}) ` : ''}${media.averageScore ? HandlerUtil.formatCommas(media.averageScore) : 'N/A'}** `,
                `Popularity: ** ${popularity ? `(#${popularity.rank}) ` : ''}${media.popularity ? HandlerUtil.formatCommas(media.popularity) : 'N/A'}** `,
                ...(media.format ? [`Format: ** ${HandlerUtil.capitalizeString(media.format)}** `] : []),
                ...(media.source ? [`Source: ** ${HandlerUtil.capitalizeString(media.source)}** `] : []),
                ...(mainStudio ? mainStudio.siteUrl ?
                    [`Studio: ** [${mainStudio.name}](${mainStudio.siteUrl}) ** `] :
                    [`Studio: ** ${mainStudio.name}** `] : []),
                ...(media.trailer && trailerUrl ? [`Trailer: ** [${media.trailer.site}](${trailerUrl}) ** `] : []),
                ...(media.episodes ? [`Episodes: ** ${(nextAiring && nextAiring.episode) ? nextAiring.episode - 1 : media.episodes} /${media.episodes}**`] : []),
                ...(media.chapters ? [`Chapters: **${media.chapters}**`] : []),
                ...(media.volumes ? [`Volumes: **${media.volumes}**`] : []),
                `Started: **${startDate ? startDate : 'unknown'}**`,
                `Ended: **${endDate ? endDate : 'unknown'}**`,
                ...(media.season ? media.seasonYear ?
                    [`Season: **[${HandlerUtil.capitalizeString(media.season)}](https://anilist.co/search/anime?year=${media.seasonYear}%25&season=${media.season})**`] :
                    [`Season: **${HandlerUtil.capitalizeString(media.season)}**`] : [])
            ];
            const infoString = `Info [${HandlerUtil.capitalizeString(media.type || 'unknown')}]`;
            if (lines.length <= 4) {
                embed.addField(infoString, [`**${infoString}**`, ...lines]), false;
            } else {
                const half = Math.ceil(lines.length / 2);
                embed.addField(infoString, lines.slice(0, half), true);
                embed.addField('\u200b', lines.slice(-half), true);
            }
        }
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
        const actionRow = new PageableActionRowBuilder();
        actionRow.addViewOnlineButton(url);
        actionRow.addPreviousPageButton(undefined, pageData.pages <= 1);
        actionRow.addNextPageButton(undefined, pageData.pages <= 1);
        return this.addActionRow(actionRow);
    }

    public addTraceMoeFile(result: TraceMoeResult): this {
        const attachment = new AttachmentBuilder(`${result.video}&size=l`);
        return this.addFile(attachment);
    }

    private static getFuzzyDateString(fuzzy: FuzzyDate, string?: boolean): string | null {
        const fuzz = {
            ...(fuzzy.day && { day: fuzzy.day }),
            ...(fuzzy.month && { month: fuzzy.month }),
            ...(fuzzy.year && { year: fuzzy.year })
        };
        if (!fuzz.day && !fuzz.month && !fuzz.month) return null;
        if (!string || Object.values(fuzz).length === 3) {
            return `<t:${Math.round(DateTime.fromObject(fuzz).toSeconds())}:d>`;
        } else {
            var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            return [fuzz.month ? months[fuzz.month - 1] : null, fuzz.day, fuzz.year].filter(part => part || part === 0).join(' ');
        }
    }
}
