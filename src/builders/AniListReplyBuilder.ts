import { ActivityUnion, AniListError, Character, FuzzyDate, Media, MediaFormat, MediaListStatus, MediaRankType, MediaStatus, ModRole, PageInfo, Staff, Studio, User, UserFormatStatistic, UserStatisticTypes, UserStatusStatistic } from "../apis/anilist/AniListAPI.js";
import { ActionRowBuilder } from "../discord/builders/ActionRowBuilder.js";
import { ButtonBuilder } from "../discord/builders/ButtonBuilder.js";
import { ReplyBuilder } from "../discord/builders/ReplyBuilder.js";
import { EmbedBuilder } from "../discord/builders/EmbedBuilder.js";
import { HandlerUtil } from "../discord/HandlerUtil.js";
import humanizeDuration from "humanize-duration";
import { Constants } from "discord.js";
import { DateTime } from "luxon";

const { MessageButtonStyles } = Constants;

export enum AniListUserComponentID {
    ANIME_LIST = 'anime_list',
    MANGA_LIST = 'manga_list',
    ACTIVITIES = 'activities',
    PROFILE = 'profile'
}

export enum AniListReplyBuilderView {
    USER = 'user',
    USER_ANIME_STATS = 'user_anime_stats',
    USER_MANGA_STATS = 'user_manga_stats',
    CHARACTER = 'character',
    STUDIO = 'studio',
    STAFF = 'staff',
    MEDIA = 'media'
};

export class AniListReplyBuilder extends ReplyBuilder {

    protected override createEmbedBuilder(pageInfo?: PageInfo): EmbedBuilder {
        const iconURL = 'https://anilist.co/img/icons/android-chrome-512x512.png';
        const embed = super.createEmbedBuilder()
            .setFooter('Powered by AniList', iconURL);
        if (pageInfo) {
            const { currentPage, total } = pageInfo;
            if (currentPage && total && total > 1) embed.setFooter(`${currentPage}/${total} Powered by AniList`, iconURL);
        }
        return embed;
    }

    public addUserButtons(stats: UserStatisticTypes, current?: AniListUserComponentID): this {
        const profileButton = new ButtonBuilder()
            .setLabel('Profile')
            .setCustomId(AniListUserComponentID.PROFILE)
            .setStyle(MessageButtonStyles.SUCCESS)
            .setDisabled(current === AniListUserComponentID.PROFILE);
        const animelistButton = new ButtonBuilder()
            .setLabel('Animelist')
            .setCustomId(AniListUserComponentID.ANIME_LIST)
            .setStyle(MessageButtonStyles.PRIMARY)
            .setDisabled(current === AniListUserComponentID.ANIME_LIST || !(stats.anime && stats.anime.count));
        const mangalistButton = new ButtonBuilder()
            .setLabel('Mangalist')
            .setCustomId(AniListUserComponentID.MANGA_LIST)
            .setStyle(MessageButtonStyles.PRIMARY)
            .setDisabled(current === AniListUserComponentID.MANGA_LIST || !(stats.manga && stats.manga.count));
        const activitiesButton = new ButtonBuilder()
            .setLabel('Activities')
            .setCustomId(AniListUserComponentID.ACTIVITIES)
            .setStyle(MessageButtonStyles.PRIMARY)
            .setDisabled(current === AniListUserComponentID.ACTIVITIES);
        const actionRow = new ActionRowBuilder()
            .addComponents([
                profileButton,
                animelistButton,
                mangalistButton,
                activitiesButton
            ]);
        return this.addActionRow(actionRow);
    }

    public addAniListErrorsEmbed(errors: AniListError[]): this {
        console.error('[anilist] AniList has responded with errors...', errors);
        const attachment = this.getAvatar('1-3');
        const embed = this.createEmbedBuilder()
            .setTitle('AniList Error')
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription([
                `AniList responded with the following messages:`,
                '',
                ...errors.map(error => `*${error.message}*`)
            ]);
        this.addFile(attachment);
        this.addEmbed(embed);
        return this;
    }

    public addUserActivitiesEmbed(user: User, activities: ActivityUnion[]): this {
        const avatarURL = user.avatar?.large || user.avatar?.medium;
        const embed = this.createEmbedBuilder()
            .setAuthor(`${user.name}'s activity`, avatarURL || undefined, user.siteUrl || undefined);
        const lines = [];
        for (const activity of activities) {
            const titleString = activity.media?.title?.romaji || activity.media?.title?.english || '**unknown**';
            const timeString = `[[${activity.createdAt ? `<t:${activity.createdAt}:R>` : '[*unknown*]'}](${activity.siteUrl || 'https://anilist.co/'})]`;
            const statusString = HandlerUtil.capitalizeString(activity.status || 'Interacted With');
            const progressString = activity.progress ? `${activity.progress} of ` : ``;
            const mediaString = `[${titleString}](${activity.media?.siteUrl || 'https://anilist.co/'})`;
            const line = `${timeString} ${statusString} ${progressString}${mediaString}`;
            lines.push(line);
        }
        const description = lines.join('\n') || 'There is no recorded activity...';
        embed.setDescription(HandlerUtil.shortenMessage(description, { maxLength: 4096 }));
        return this.addEmbed(embed);
    }

    public addUserStatsEmbed(type: 'anime' | 'manga', user: User): this {
        const attachment = this.getEmbedWidenerAttachment();
        const typeName = HandlerUtil.capitalizeString(type);
        const avatarURL = user.avatar?.large || user.avatar?.medium;
        const embed = this.createEmbedBuilder()
            .setImage(attachment.getEmbedUrl())
            .setAuthor(`${user.name}'s ${type}list`, avatarURL || undefined, user.siteUrl || undefined);
        const stats = user.statistics?.[type];
        if (!stats || !stats.count) {
            embed.setDescription('they exist but haven\'t done anything ¯\\_(ツ)_/¯');
        } else {
            embed.addField(`${typeName} Stats`, [
                `Total ${typeName}: **${stats.count}**`,
                ...(stats.chaptersRead ? [`Chapters: **${stats.chaptersRead}**`] : []),
                ...(stats.volumesRead ? [`Volumes: **${stats.volumesRead}**`] : []),
                ...(stats.episodesWatched ? [
                    `Episodes: **${HandlerUtil.formatCommas(stats.episodesWatched)}**`,
                    `Average Eps: **${HandlerUtil.formatCommas(Math.round(stats.episodesWatched / (stats.count || 1)))}**`
                ] : []),
                ...(stats.minutesWatched ? [`Watched: **${humanizeDuration(stats.minutesWatched * 60 * 1000, { round: true, units: ['d'] })}**`] : []),
                `Mean Score: **${stats.meanScore || 0}**`,
                `Std deviation: **${stats.standardDeviation || 0}**`
            ], true);
            // stats.formats
            const formatLines = [];
            for (const stat of AniListReplyBuilder.transformFormats(type, stats.formats || [])) {
                if (!stat.format) continue;
                const enumName = AniListReplyBuilder.formatEnums(stat.format);
                formatLines.push(`${enumName}: **${stat.count}**`);
            }
            if (formatLines.length) embed.addField('Formats', formatLines, true);
            // stats.status
            const statusLines = [];
            for (const stat of AniListReplyBuilder.transformStatuses(stats.statuses || [])) {
                if (!stat.status) continue;
                const enumName = AniListReplyBuilder.formatEnums(stat.status);
                statusLines.push(`${enumName}: **${stat.count}**`);
            }
            if (statusLines.length) embed.addField('Status', statusLines, true);
            if (stats.genres) {
                const lines = [];
                for (const stat of stats.genres) {
                    if (!stat.count || !stat.genre) continue;
                    const url = `https://anilist.co/search/${type}?includedGenres=${stat.genre.replace(/ /g, '%20')}`;
                    lines.push(`${stat.count} [${stat.genre}](${url})`);
                }
                if (lines.length) embed.addField('Genres', lines, true);
            }
            if (stats.tags) {
                const lines = [];
                for (const stat of stats.tags) {
                    if (!stat.count || !stat.tag || !stat.tag.name) continue;
                    const url = `https://anilist.co/search/${type}?includedTags=${stat.tag.name.replace(/ /g, '%20')}`;
                    lines.push(`${stat.count} [${stat.tag.name}](${url}) ${stat.tag.isAdult ? '(18+)' : ''}`);
                }
                if (lines.length) embed.addField('Tags', lines, true);
            }
        }
        return this.addFile(attachment).addEmbed(embed);
    }

    public addUserEmbed(user: User, pageInfo?: PageInfo): this {
        const modRoles = user.moderatorRoles && user.moderatorRoles.length ? user.moderatorRoles : null;
        const totalFavouriteAnime = user.favourites?.anime?.pageInfo?.total || 0;
        const totalFavouriteManga = user.favourites?.manga?.pageInfo?.total || 0;
        const totalFavouriteCharacters = user.favourites?.characters?.pageInfo?.total || 0;
        const totalFavouriteStaff = user.favourites?.staff?.pageInfo?.total || 0;
        const totalFavouriteStudios = user.favourites?.studios?.pageInfo?.total || 0;
        const descriptionLines = [
            ...(user.createdAt ? [`Account Created: **<t:${user.createdAt}:d>**`] : []),
            ...(user.updatedAt ? [`Account Updated: **<t:${user.updatedAt}:d>**`] : []),
            ...(modRoles ? [`Moderator Roles: **${modRoles.map(modRole => AniListReplyBuilder.formatEnums(modRole)).join('**, **')}**`] : []),
            ...(user.donatorTier ? [
                `Donator Tier: **${user.donatorTier}**`,
                ...(user.donatorBadge ? [`Donator Badge: **${user.donatorBadge}**`] : [])
            ] : []),
            ...(totalFavouriteAnime ? [`Favourite Anime: **${totalFavouriteAnime}**`] : []),
            ...(totalFavouriteManga ? [`Favourite Manga: **${totalFavouriteManga}**`] : []),
            ...(totalFavouriteCharacters ? [`Favourite Characters: **${totalFavouriteCharacters}**`] : []),
            ...(totalFavouriteStaff ? [`Favourite Staff: **${totalFavouriteStaff}**`] : []),
            ...(totalFavouriteStudios ? [`Favourite Studios: **${totalFavouriteStudios}**`] : []),
        ];
        const embed = this.createEmbedBuilder(pageInfo)
            .setTitle(`${user.name}'s Profile`);
        if (descriptionLines.length) embed.setDescription(descriptionLines);
        if (user.siteUrl) embed.setURL(user.siteUrl);
        if (user.bannerImage) embed.setImage(user.bannerImage);
        if (user.avatar) {
            const avatar = user.avatar;
            const avatarURL = avatar.large || avatar.medium;
            if (avatarURL) embed.setThumbnail(avatarURL);
        }
        return this.addEmbed(embed);
    }

    public addMediaEmbed(media: Media, pageInfo?: PageInfo): this {
        const embed = this.createEmbedBuilder(pageInfo);
        const popularity = media.rankings ? media.rankings.find(ranking => ranking.allTime && ranking.type === MediaRankType.POPULAR) : undefined;
        const rated = media.rankings ? media.rankings.find(ranking => ranking.allTime && ranking.type === MediaRankType.RATED) : undefined;
        const nextAiringEpisode = media.nextAiringEpisode?.episode || null;
        const mainStudioEdge = media.studios && media.studios.edges ? media.studios.edges.find(edge => edge.isMain) : null;
        const mainStudio = mainStudioEdge ? mainStudioEdge.node ?? null : null;
        const startDate = media.startDate ? AniListReplyBuilder.getFuzzyDateString(media.startDate) : null;
        const endDate = media.endDate ? AniListReplyBuilder.getFuzzyDateString(media.endDate) : null;
        if (media.title) {
            const title = media.title.romaji || media.title.english || media.title.native;
            if (title) embed.setTitle(`${title} ${(media.isAdult ?? false) ? '(18+)' : ''}`);
        }
        if (media.bannerImage) embed.setImage(media.bannerImage);
        if (media.siteUrl) embed.setURL(media.siteUrl);
        if (media.coverImage) {
            const coverImage = media.coverImage;
            const coverImageUrl = coverImage.extraLarge || coverImage.large || coverImage.medium;
            if (coverImageUrl) embed.setThumbnail(coverImageUrl);
            if (coverImage.color) embed.setColor(parseInt(coverImage.color.substring(1), 16));
        }
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
            ...(media.episodes ? [`Episodes: ** ${nextAiringEpisode ? nextAiringEpisode - 1 : media.episodes} /${media.episodes}**`] : []),
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
            embed.setDescription([`**${infoString}**`, ...lines]);
        } else {
            const half = Math.ceil(lines.length / 2);
            embed.addField(infoString, lines.slice(0, half), true);
            embed.addField('\u200b', lines.slice(-half), true);
        }
        return this.addEmbed(embed);
    }

    public addCharacterEmbed(character: Character, pageInfo?: PageInfo): this {
        const dateOfBirth = character.dateOfBirth ? AniListReplyBuilder.getFuzzyDateString(character.dateOfBirth, true) : null;
        const embed = this.createEmbedBuilder(pageInfo)
            .setTitle(character.name ? (character.name.full || Object.values(character.name)[0] || 'Unknown name') : 'Unknown name')
            .setDescription([
                `Names: **${Object.values(character.name || {}).filter(name => name).join(', ') || `*unknown*`}**`,
                ...(character.favourites ? [`Favourites: **${HandlerUtil.formatCommas(character.favourites)}**`] : []),
                ...(character.age ? [`Age: **${character.age.split('-').filter(part => part).join('-')}**`] : []),
                ...(character.gender ? [`Gender: **${character.gender}**`] : []),
                ...(dateOfBirth ? [`Birthday: **${character.bloodType}**`] : []),
                ...(character.bloodType ? [`Blood Type: **${character.bloodType}**`] : [])
            ]);
        if (character.siteUrl) embed.setURL(character.siteUrl);
        if (character.image) embed.setThumbnail(character.image.large || character.image.medium!);
        return this.addEmbed(embed);
    }

    public addStaffEmbed(staff: Staff, pageInfo?: PageInfo): this {
        const dateOfBirth = staff.dateOfBirth && staff.dateOfBirth.year ? AniListReplyBuilder.getFuzzyDateString(staff.dateOfBirth, true) : null;
        const dateOfDeath = staff.dateOfDeath && staff.dateOfDeath.year ? AniListReplyBuilder.getFuzzyDateString(staff.dateOfDeath, true) : null;
        const [startYear, endYear] = staff.yearsActive || [];
        const totalMedia = staff.staffMedia?.pageInfo?.total || 0;
        const totalCharacters = staff.characters?.pageInfo?.total || 0;
        const occupations = staff.primaryOccupations || [];
        const embed = this.createEmbedBuilder(pageInfo)
            .setTitle(staff.name ? (staff.name.full || Object.values(staff.name)[0] || 'Unknown name') : 'Unknown name')
            .setDescription([
                `Names: **${Object.values(staff.name || {}).filter(name => name).join(', ') || `*unknown*`}**`,
                ...(staff.favourites ? [`Favourites: **${HandlerUtil.formatCommas(staff.favourites)}**`] : []),
                ...(staff.age ? [`Age: **${staff.age}**`] : []),
                ...(staff.gender ? [`Gender: **${staff.gender}**`] : []),
                ...(staff.dateOfBirth && dateOfBirth ? [`Born: **${dateOfBirth}**`] : []),
                ...(staff.dateOfDeath && dateOfDeath ? [`Died: **${dateOfDeath}**`] : []),
                ...(staff.bloodType ? [`Blood Type: **${staff.bloodType}**`] : []),
                ...(staff.languageV2 ? [`Language: **${staff.languageV2}**`] : []),
                ...(occupations.length ? [`Occupations: **${occupations.join(', ')}**`] : []),
                ...(staff.homeTown ? [`Home Town: **${staff.homeTown}**`] : []),
                ...(staff.yearsActive && startYear ? [`Years Active: **${startYear} - ${endYear || 'current'}**`] : []),
                ...(totalCharacters ? [`Total Characters: **${HandlerUtil.formatCommas(totalCharacters)}**`] : []),
                ...(totalMedia ? [`Total Media: **${HandlerUtil.formatCommas(totalMedia)}**`] : [])
            ]);
        if (staff.siteUrl) embed.setURL(staff.siteUrl);
        if (staff.image) embed.setThumbnail(staff.image.large || staff.image.medium!);
        return this.addEmbed(embed);
    }

    public addStudioEmbed(studio: Studio, pageInfo?: PageInfo): this {
        const totalMedia = studio.media?.pageInfo?.total || 0;
        const embed = this.createEmbedBuilder(pageInfo)
            .setTitle(studio.name || 'Unknown Studio')
            .setDescription([
                `Animation Studio: **${studio.isAnimationStudio ? 'yes' : 'no'}**`,
                ...(studio.favourites ? [`Favourites: **${HandlerUtil.formatCommas(studio.favourites)}**`] : []),
                ...(totalMedia ? [`Total Characters: **${HandlerUtil.formatCommas(totalMedia)}**`] : [])
            ]);
        if (studio.siteUrl) embed.setURL(studio.siteUrl);
        return this.addEmbed(embed);
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

    private static formatEnums(value: ModRole | MediaStatus | MediaListStatus | MediaFormat): string {
        switch (value) {
            case ModRole.ADMIN: return 'Admin';
            case ModRole.ANIME_DATA: return 'Anime Data';
            case ModRole.COMMUNITY: return 'Community';
            case ModRole.DEVELOPER: return 'Developer';
            case ModRole.DISCORD_COMMUNITY: return 'Discord Community';
            case ModRole.LEAD_ANIME_DATA: return 'Lead Anime Data';
            case ModRole.LEAD_COMMUNITY: return 'Lead Community';
            case ModRole.LEAD_DEVELOPER: return 'Lead Developer';
            case ModRole.LEAD_MANGA_DATA: return 'Lead Manga Data';
            case ModRole.LEAD_SOCIAL_MEDIA: return 'Lead Social Media';
            case ModRole.MANGA_DATA: return 'Manga Data';
            case ModRole.RETIRED: return 'Retired';
            case ModRole.SOCIAL_MEDIA: return 'Social Media';
            case MediaStatus.CANCELLED: return 'Cancelled';
            case MediaStatus.FINISHED: return 'Finished';
            case MediaStatus.HIATUS: return 'Hiatus';
            case MediaStatus.NOT_YET_RELEASED: return 'Not Yet Released';
            case MediaStatus.RELEASING: return 'Releasing';
            case MediaListStatus.COMPLETED: return 'Completed';
            case MediaListStatus.CURRENT: return 'Current';
            case MediaListStatus.DROPPED: return 'Dropped';
            case MediaListStatus.PAUSED: return 'Paused';
            case MediaListStatus.PLANNING: return 'Planning';
            case MediaListStatus.REPEATING: return 'Repeating';
            case MediaFormat.MANGA: return 'Manga';
            case MediaFormat.MOVIE: return 'Movie';
            case MediaFormat.MUSIC: return 'Music';
            case MediaFormat.NOVEL: return 'Novel';
            case MediaFormat.ONA: return 'ONA';
            case MediaFormat.ONE_SHOT: return 'One Shot';
            case MediaFormat.OVA: return 'OVA';
            case MediaFormat.SPECIAL: return 'Special';
            case MediaFormat.TV: return 'TV';
            case MediaFormat.TV_SHORT: return 'TV Short';
            default: {
                console.log(`[support] unknown anilist enum value <${value}>`);
                return value;
            }
        }
    }

    private static transformFormats(type: 'anime' | 'manga', formats: UserFormatStatistic[]): UserFormatStatistic[] {
        const emptyFormatStatistic = { count: 0, meanScore: 0, minutesWatched: 0, chaptersRead: 0, mediaIds: [] };
        switch (type) {
            case 'manga': {
                if (!formats.some(format => format.format === MediaFormat.MANGA)) formats.push({ format: MediaFormat.MANGA, ...emptyFormatStatistic });
                if (!formats.some(format => format.format === MediaFormat.NOVEL)) formats.push({ format: MediaFormat.NOVEL, ...emptyFormatStatistic });
                if (!formats.some(format => format.format === MediaFormat.ONE_SHOT)) formats.push({ format: MediaFormat.ONE_SHOT, ...emptyFormatStatistic });
                return formats;
            }
            case 'anime': {
                if (!formats.some(format => format.format === MediaFormat.TV)) formats.push({ format: MediaFormat.TV, ...emptyFormatStatistic });
                if (!formats.some(format => format.format === MediaFormat.MOVIE)) formats.push({ format: MediaFormat.MOVIE, ...emptyFormatStatistic });
                if (!formats.some(format => format.format === MediaFormat.TV_SHORT)) formats.push({ format: MediaFormat.TV_SHORT, ...emptyFormatStatistic });
                if (!formats.some(format => format.format === MediaFormat.OVA)) formats.push({ format: MediaFormat.OVA, ...emptyFormatStatistic });
                if (!formats.some(format => format.format === MediaFormat.ONA)) formats.push({ format: MediaFormat.ONA, ...emptyFormatStatistic });
                if (!formats.some(format => format.format === MediaFormat.SPECIAL)) formats.push({ format: MediaFormat.SPECIAL, ...emptyFormatStatistic });
                if (!formats.some(format => format.format === MediaFormat.MUSIC)) formats.push({ format: MediaFormat.MUSIC, ...emptyFormatStatistic });
                return formats;
            }
        }
    }

    private static transformStatuses(statuses: UserStatusStatistic[]): UserStatusStatistic[] {
        const emptyStatusStatistic = { count: 0, meanScore: 0, minutesWatched: 0, chaptersRead: 0, mediaIds: [] };
        if (!statuses.some(status => status.status === MediaListStatus.CURRENT)) statuses.push({ status: MediaListStatus.CURRENT, ...emptyStatusStatistic });
        if (!statuses.some(status => status.status === MediaListStatus.COMPLETED)) statuses.push({ status: MediaListStatus.COMPLETED, ...emptyStatusStatistic });
        if (!statuses.some(status => status.status === MediaListStatus.PAUSED)) statuses.push({ status: MediaListStatus.PAUSED, ...emptyStatusStatistic });
        if (!statuses.some(status => status.status === MediaListStatus.PLANNING)) statuses.push({ status: MediaListStatus.PLANNING, ...emptyStatusStatistic });
        if (!statuses.some(status => status.status === MediaListStatus.DROPPED)) statuses.push({ status: MediaListStatus.DROPPED, ...emptyStatusStatistic });
        if (!statuses.some(status => status.status === MediaListStatus.REPEATING)) statuses.push({ status: MediaListStatus.REPEATING, ...emptyStatusStatistic });
        return statuses;
    }
}
