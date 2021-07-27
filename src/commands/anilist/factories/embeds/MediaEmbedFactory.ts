import { AnimeCustomData, AnimeHandler } from '../../handlers/AnimeHandler';
import { HandlerContext, HandlerEmbed } from 'discord.js-commands';
import { AniListEmbedFactory } from '../AniListEmbedFactory';
import { Media, MediaRankType } from '../../api/AniListAPI';
import { Page } from '../../api/interfaces/Common';
import { Util } from 'discord.js';

// @ts-ignore
import * as DHMS from 'dhms.js';

export class MediaEmbedFactory extends AniListEmbedFactory {

    public static getMediaPageEmbed(handler: AnimeHandler, context: HandlerContext, media: Media, page: Page, customData: AnimeCustomData): HandlerEmbed {
        const embed = MediaEmbedFactory.getMediaEmbed(handler, context, media, customData);
        embed.setAuthor(`Search: ${customData.search}`)
        embed.setFooter(`${customData.page! + 1}/${page.pageInfo.total} - ${embed.footer!.text}`, embed.footer!.iconURL);
        return embed;
    }

    public static getMediaEmbed(handler: AnimeHandler, context: HandlerContext, media: Media, customData: AnimeCustomData): HandlerEmbed {
        const popularity = media.rankings ? media.rankings.find(ranking => ranking.allTime && ranking.type === MediaRankType.POPULAR) : undefined;
        const rated = media.rankings ? media.rankings.find(ranking => ranking.allTime && ranking.type === MediaRankType.RATED) : undefined;
        const nextAiring = media.nextAiringEpisode;
        const mainStudioEdge = media.studios && media.studios.edges ? media.studios.edges.find(edge => edge.isMain) : null;
        const mainStudio = mainStudioEdge ? mainStudioEdge.node ?? null : null;
        const trailerUrl = media.trailer ? (
            media.trailer.site === 'youtube' ? `https://www.youtube.com/watch?v=${media.trailer.id}` : (
                media.trailer.site === 'dailymotion' ? `https://www.dailymotion.com/video/${media.trailer.id}` : null
            )
        ) : null
        const embed = handler.getEmbedTemplate(context)
        if (media.title) {
            const title = media.title.romaji || media.title.english || media.title.native;
            if (title) embed.setTitle(`${title} ${(media.isAdult ?? false) ? '(18+)' : ''}`)
        }
        if (media.siteUrl) embed.setURL(media.siteUrl);
        if (media.coverImage) {
            const coverImage = media.coverImage;
            const coverImageUrl = coverImage.extraLarge || coverImage.large || coverImage.medium;
            if (coverImageUrl) embed.setThumbnail(coverImageUrl);
            if (coverImage.color) embed.setColor(parseInt(coverImage.color.substring(1), 16))
        }
        embed.addField('Info', [
            ...(media.status ? [`Status: **${Util.capitalizeString(media.status)}**`] : []),
            ...(nextAiring ? [`Airing: **${DHMS.print(nextAiring.timeUntilAiring * 1000, { limit: 3 })}**`] : []),
            `Score: **${rated ? `(#${rated.rank}) ` : ''}${media.averageScore ? Util.formatCommas(media.averageScore) : 'N/A'}**`,
            // (media.stats.scoreDistribution.length ? `Haters: **${media.stats.scoreDistribution[0].amount}**\n` : '') +
            ...(media.format ? [`Format: **${Util.capitalizeString(media.format)}**`] : []),
            ...(media.source ? [`Source: **${Util.capitalizeString(media.source)}**`] : []),
            ...(mainStudio ? mainStudio.siteUrl ?
                [`Studio: **[${mainStudio.name}](${mainStudio.siteUrl})**`] :
                [`Studio: **${mainStudio.name}**`] : []),
            ...(media.trailer && trailerUrl ? [`Trailer: **[${media.trailer.site}](${trailerUrl})**`] : [])
        ].join('\n'), true);

        embed.addField('\u200b', ([
            `Popularity: **${popularity ? `(#${popularity.rank}) ` : ''}${media.popularity ? Util.formatCommas(media.popularity) : 'N/A'}**`,
            ...(media.episodes ? [`Episodes: **${nextAiring ? nextAiring.episode - 1 : media.episodes}/${media.episodes}**`] : []),
            `Started: **${media.startDate ? MediaEmbedFactory.getFuzzyDateString(media.startDate) : 'unknown'}**`,
            `Ended: **${media.endDate ? MediaEmbedFactory.getFuzzyDateString(media.endDate) : 'unknown'}**`,
            ...(media.season ? media.seasonYear ?
                [`Season: **[${Util.capitalizeString(media.season)}](https://anilist.co/search/anime?year=${media.seasonYear}%25&season=${media.season})**`] :
                [`Season: **${Util.capitalizeString(media.season)}**`] : []),
        ].join('\n')), true);
        if (customData.desc && media.description) {
            embed.addField('Description', MediaEmbedFactory.reduceDescription(media.description), false);
        } else if (media.bannerImage) {
            embed.setImage(media.bannerImage);
        }
        return embed;
    }
}
