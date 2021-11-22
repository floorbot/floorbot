import { HandlerReplies } from '../../../../helpers/HandlerReplies';

export class AniListReplies extends HandlerReplies {

    constructor() {
        super();
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
//
// public getEmbed(context: HandlerContext, customData: AniListCustomData, page: Page): HandlerEmbed {
//     const media = page.media![0]!;
//     const pageInfo = page.pageInfo!;
//     const popularity = media.rankings ? media.rankings.find(ranking => ranking.allTime && ranking.type === MediaRankType.POPULAR) : undefined;
//     const rated = media.rankings ? media.rankings.find(ranking => ranking.allTime && ranking.type === MediaRankType.RATED) : undefined;
//     const nextAiring = media.nextAiringEpisode;
//     const mainStudioEdge = media.studios && media.studios.edges ? media.studios.edges.find(edge => edge.isMain) : null;
//     const mainStudio = mainStudioEdge ? mainStudioEdge.node ?? null : null;
//     const trailerUrl = media.trailer ? (
//         media.trailer.site === 'youtube' ? `https://www.youtube.com/watch?v=${media.trailer.id}` : (
//             media.trailer.site === 'dailymotion' ? `https://www.dailymotion.com/video/${media.trailer.id}` : null
//         )
//     ) : null
//     const embed = this.getEmbedTemplate(context, customData, pageInfo);
//     if (media.title) {
//         const title = media.title.romaji || media.title.english || media.title.native;
//         if (title) embed.setTitle(`${title} ${(media.isAdult ?? false) ? '(18+)' : ''}`)
//     }
//     if (media.siteUrl) embed.setURL(media.siteUrl);
//     if (media.coverImage) {
//         const coverImage = media.coverImage;
//         const coverImageUrl = coverImage.extraLarge || coverImage.large || coverImage.medium;
//         if (coverImageUrl) embed.setThumbnail(coverImageUrl);
//         if (coverImage.color) embed.setColor(parseInt(coverImage.color.substring(1), 16))
//     }
//     embed.addField('Info', [
//         ...(media.status ? [`Status: **${Util.capitalizeString(media.status)}**`] : []),
//         ...(nextAiring ? [`Airing: **${DHMS.print(nextAiring.timeUntilAiring * 1000, { limit: 3 })}**`] : []),
//         `Score: **${rated ? `(#${rated.rank}) ` : ''}${media.averageScore ? Util.formatCommas(media.averageScore) : 'N/A'}**`,
//         // (media.stats.scoreDistribution.length ? `Haters: **${media.stats.scoreDistribution[0].amount}**\n` : '') +
//         ...(media.format ? [`Format: **${Util.capitalizeString(media.format)}**`] : []),
//         ...(media.source ? [`Source: **${Util.capitalizeString(media.source)}**`] : []),
//         ...(mainStudio ? mainStudio.siteUrl ?
//             [`Studio: **[${mainStudio.name}](${mainStudio.siteUrl})**`] :
//             [`Studio: **${mainStudio.name}**`] : []),
//         ...(media.trailer && trailerUrl ? [`Trailer: **[${media.trailer.site}](${trailerUrl})**`] : [])
//     ].join('\n'), true);
//
//     embed.addField('\u200b', ([
//         `Popularity: **${popularity ? `(#${popularity.rank}) ` : ''}${media.popularity ? Util.formatCommas(media.popularity) : 'N/A'}**`,
//         ...(media.episodes ? [`Episodes: **${nextAiring ? nextAiring.episode - 1 : media.episodes}/${media.episodes}**`] : []),
//         `Started: **${media.startDate ? this.getFuzzyDateString(media.startDate) : 'unknown'}**`,
//         `Ended: **${media.endDate ? this.getFuzzyDateString(media.endDate) : 'unknown'}**`,
//         ...(media.season ? media.seasonYear ?
//             [`Season: **[${Util.capitalizeString(media.season)}](https://anilist.co/search/anime?year=${media.seasonYear}%25&season=${media.season})**`] :
//             [`Season: **${Util.capitalizeString(media.season)}**`] : []),
//     ].join('\n')), true);
//     if (customData.display === 'desc' && media.description) {
//         embed.addField('Description', this.reduceDescription(media.description), false);
//     } else if (media.bannerImage) {
//         embed.setImage(media.bannerImage);
//     }
//     return embed;
// }
