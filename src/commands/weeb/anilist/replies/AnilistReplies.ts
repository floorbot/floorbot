import { AniListResponse, FuzzyDate, MediaRankType, Page } from '../../../../apis/anilist/AniListAPI.js';
import { CommandInteraction, Interaction, InteractionReplyOptions, Message, Util } from 'discord.js';
import { HandlerEmbed } from '../../../../discord/components/HandlerEmbed.js';
import { HandlerUtil } from '../../../../discord/handler/HandlerUtil.js';
import { HandlerReplies } from '../../../../helpers/HandlerReplies.js';
import { DateTime } from 'luxon';

export class AniListReplies extends HandlerReplies {

    constructor() {
        super();
    }

    public override createEmbedTemplate(context: Interaction | Message, page?: Page): HandlerEmbed {
        const embed = super.createEmbedTemplate(context)
            .setFooter('Powered by AniList', 'https://anilist.co/img/icons/android-chrome-512x512.png');
        if (page && page.pageInfo) {
            const { currentPage, total } = page.pageInfo;
            if (currentPage && total && total > 1) embed.setFooter(`${currentPage}/${total} Powered by AniList`, 'https://anilist.co/img/icons/android-chrome-512x512.png')
        }
        return embed;
    }

    public createAniListErrorReply(command: CommandInteraction, res: AniListResponse): InteractionReplyOptions {
        console.error('[anilist] There was an anilist error...', res);
        const attachment = this.getAvatar('1-3');
        const embed = this.createEmbedTemplate(command)
            .setTitle('AniList Error')
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription(res.errors && res.errors[0] ? res.errors[0].message : 'Unknown reason...')
        return { embeds: [embed], files: [attachment] }
    }

    public createMediaReply(context: Interaction | Message, page: Page, showDescription?: boolean) {
        const media = page.media ? page.media[0] : null;
        const pageInfo = page.pageInfo;
        if (!media || !pageInfo) throw new Error('[anilist] page does not include <pageInfo> and/or <media>')

        const popularity = media.rankings ? media.rankings.find(ranking => ranking.allTime && ranking.type === MediaRankType.POPULAR) : undefined;
        const rated = media.rankings ? media.rankings.find(ranking => ranking.allTime && ranking.type === MediaRankType.RATED) : undefined;
        const nextAiring = media.nextAiringEpisode;

        const mainStudioEdge = media.studios && media.studios.edges ? media.studios.edges.find(edge => edge.isMain) : null;
        const mainStudio = mainStudioEdge ? mainStudioEdge.node ?? null : null;

        const embed = this.createEmbedTemplate(context, page)
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

        const trailerUrl = media.trailer ? (
            media.trailer.site === 'youtube' ? `https://www.youtube.com/watch?v=${media.trailer.id}` : (
                media.trailer.site === 'dailymotion' ? `https://www.dailymotion.com/video/${media.trailer.id}` : null
            )
        ) : null


        embed.addField(`Info [${HandlerUtil.capitalizeString(media.type || 'unknown')}]`, [
            ...(media.status ? [`Status: **${HandlerUtil.capitalizeString(media.status)}**`] : []),
            ...(media.nextAiringEpisode ? [`Airing: **<t:${Math.round(new DateTime().plus({ seconds: media.nextAiringEpisode.timeUntilAiring }).toSeconds())}:R>**`] : []),
            `Score: **${rated ? `(#${rated.rank}) ` : ''}${media.averageScore ? HandlerUtil.formatCommas(media.averageScore) : 'N/A'}**`,
            `Popularity: **${popularity ? `(#${popularity.rank}) ` : ''}${media.popularity ? HandlerUtil.formatCommas(media.popularity) : 'N/A'}**`,
            ...(media.format ? [`Format: **${HandlerUtil.capitalizeString(media.format)}**`] : []),
            ...(media.source ? [`Source: **${HandlerUtil.capitalizeString(media.source)}**`] : []),
            ...(mainStudio ? mainStudio.siteUrl ?
                [`Studio: **[${mainStudio.name}](${mainStudio.siteUrl})**`] :
                [`Studio: **${mainStudio.name}**`] : []),
            ...(media.trailer && trailerUrl ? [`Trailer: **[${media.trailer.site}](${trailerUrl})**`] : [])
        ].join('\n'), true);


        embed.addField('\u200b', ([
            ...(media.episodes ? [`Episodes: **${nextAiring ? nextAiring.episode - 1 : media.episodes}/${media.episodes}**`] : []),
            ...(media.chapters ? [`Chapters: **${media.chapters}**`] : []),
            ...(media.volumes ? [`Volumes: **${media.volumes}**`] : []),
            `Started: **${media.startDate ? AniListReplies.getFuzzyDateString(media.startDate) : 'unknown'}**`,
            `Ended: **${media.endDate ? AniListReplies.getFuzzyDateString(media.endDate) : 'unknown'}**`,
            ...(media.season ? media.seasonYear ?
                [`Season: **[${HandlerUtil.capitalizeString(media.season)}](https://anilist.co/search/anime?year=${media.seasonYear}%25&season=${media.season})**`] :
                [`Season: **${HandlerUtil.capitalizeString(media.season)}**`] : []),

        ].join('\n')), true);
        if (showDescription && media.description) {
            embed.addField('Description', AniListReplies.reduceDescription(media.description), false);
        } else if (media.bannerImage) {
            embed.setImage(media.bannerImage);
        }
        return { embeds: [embed] };
    }

    public static getFuzzyDateString(fuzzy: FuzzyDate) {
        return `<t:${Math.round(DateTime.fromObject(fuzzy).toSeconds())}:d>`;
    }

    public static reduceDescription(description: string) {
        return Util.splitMessage(description.replace(/<\/?[^>]+(>|$)/g, ''), { char: ' ', append: '...', maxLength: 1024 })[0]!
    }
}

// public getCharacterEdgeEmbed(context: HandlerContext, customData: AniListCustomData, page: Page): HandlerEmbed {
//     const media = page.media![0]!;
//     const connection = media.characters!;
//     const pageInfo = connection.pageInfo!;
//     const edge = connection.edges![0]!;
//     const character = edge.node!;
//     const embed = this.getEmbedTemplate(context, customData, pageInfo);
//
//     if (media.title && media.coverImage) {
//         const coverImage = media.coverImage;
//         const coverImageUrl = coverImage.extraLarge || coverImage.large || coverImage.medium;
//         const title = media.title.romaji || media.title.english || media.title.native;
//         if (title && coverImageUrl) if (title) embed.setAuthor(title, coverImageUrl);
//         if (coverImage.color) embed.setColor(parseInt(coverImage.color.substring(1), 16))
//     }
//     if (character.name) {
//         const name = character.name.full || character.name.first || character.name.native;
//         if (name) embed.setTitle(name);
//     }
//     if (character.siteUrl) embed.setURL(character.siteUrl);
//     if (character.image) {
//         const image = character.image.large || character.image.medium;
//         if (image) embed.setThumbnail(image);
//     }
//
//     const dateOfBirth = character.dateOfBirth ? this.getFuzzyDateString(character.dateOfBirth) : null;
//
//     embed.setDescription([
//         ...(character.name && character.name.native ? [`Weeb Name: **${character.name.native}**`] : []),
//         ...(character.favourites ? [`Favourites: **${Util.formatCommas(character.favourites)}**`] : []),
//         ...(character.gender ? [`Gender: **${character.gender}**`] : []),
//         ...(character.age ? [`Age: **${character.age}**`] : []),
//         ...(dateOfBirth ? [`Birthday: **${dateOfBirth}**`] : []),
//         ...(character.bloodType ? [`Blood Type: **${character.bloodType}**`] : [])
//     ].join('\n'));
//     if (media.coverImage && media.coverImage.color) embed.setColor(parseInt(media.coverImage.color.substring(1), 16));
//     return embed;
// }
