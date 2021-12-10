import { AniListError, AniListResponse, Character, FuzzyDate, Media, MediaRankType, MediaStatus, ModRole, Page, PageInfo, Staff, Studio, User } from "../apis/anilist/AniListAPI.js";
import { EmbedBuilder } from "../discord/builders/EmbedBuilder.js";
import { ReplyBuilder } from "../discord/builders/ReplyBuilder.js";
import { HandlerUtil } from "../discord/HandlerUtil.js";
import { DateTime } from "luxon";

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

    public addAniListEmbeds(res: AniListResponse, search?: string): this {
        if (res.errors) {
            res.errors.forEach(error => this.addAniListErrorEmbed(error));
        } else if (res.data) {
            const { User, Media, Staff, Studio, Character, Page } = res.data;
            if (User) this.addUserEmbed(User);
            if (Media) this.addMediaEmbed(Media);
            if (Staff) this.addStaffEmbed(Staff);
            if (Studio) this.addStudioEmbed(Studio);
            if (Character) this.addCharacterEmbed(Character);
            if (Page) {
                const { users, media, staff, studios, characters, pageInfo } = Page;
                if (users) users.forEach(user => this.addUserEmbed(user, pageInfo));
                if (media) media.forEach(media => this.addMediaEmbed(media, pageInfo));
                if (staff) staff.forEach(staff => this.addStaffEmbed(staff, pageInfo));
                if (studios) studios.forEach(studio => this.addStudioEmbed(studio, pageInfo));
                if (characters) characters.forEach(character => this.addCharacterEmbed(character, pageInfo));
                if (!(
                    (users && users.length) ||
                    (media && media.length) ||
                    (staff && staff.length) ||
                    (studios && studios.length) ||
                    (characters && characters.length)
                )) this.addNotFoundEmbed(search);
            }
            if (!(User || Media || Staff || Studio || Character || Page)) this.addNotFoundEmbed(search);
        }
        return this;
    }

    public addAniListPageActionRow(Page: Page): this {
        const siteURLs: string[] = [];
        const { users, media, characters, staff, pageInfo } = Page;
        if (users) { users.forEach(user => { if (user.siteUrl) siteURLs.push(user.siteUrl); }); }
        if (media) { media.forEach(media => { if (media.siteUrl) siteURLs.push(media.siteUrl); }); }
        if (characters) { characters.forEach(character => { if (character.siteUrl) siteURLs.push(character.siteUrl); }); }
        if (staff) { staff.forEach(staff => { if (staff.siteUrl) siteURLs.push(staff.siteUrl); }); }
        const siteURL = siteURLs.length === 1 ? siteURLs[0] : undefined;
        const totalPages = pageInfo ? pageInfo.total || 0 : 0;
        if (totalPages) return this.addPageActionRow(siteURL, undefined, totalPages <= 1);
        return this;
    }

    public addAniListErrorEmbed(error: AniListError): this {
        console.error('[anilist] AniList has responded an error...', error);
        const attachment = this.getAvatar('1-3');
        const embed = this.createEmbedBuilder()
            .setTitle('AniList Error')
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription([
                `Status: *${error.status}*`,
                `Locations: *${error.locations.length}*`,
                `Message: *${error.message}*`
            ]);
        this.addFile(attachment);
        this.addEmbed(embed);
        return this;
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
            .setTitle(user.name);
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

    public addMediaEmbed(media: Media, pageInfo?: PageInfo, showDescription?: boolean): this {
        const embed = this.createEmbedBuilder(pageInfo);
        const popularity = media.rankings ? media.rankings.find(ranking => ranking.allTime && ranking.type === MediaRankType.POPULAR) : undefined;
        const rated = media.rankings ? media.rankings.find(ranking => ranking.allTime && ranking.type === MediaRankType.RATED) : undefined;
        const nextAiring = media.nextAiringEpisode;
        const mainStudioEdge = media.studios && media.studios.edges ? media.studios.edges.find(edge => edge.isMain) : null;
        const mainStudio = mainStudioEdge ? mainStudioEdge.node ?? null : null;
        const startDate = media.startDate ? AniListReplyBuilder.getFuzzyDateString(media.startDate) : null;
        const endDate = media.endDate ? AniListReplyBuilder.getFuzzyDateString(media.endDate) : null;
        if (media.title) {
            const title = media.title.romaji || media.title.english || media.title.native;
            if (title) embed.setTitle(`${title} ${(media.isAdult ?? false) ? '(18+)' : ''}`);
        }
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
            ...(media.episodes ? [`Episodes: ** ${nextAiring ? nextAiring.episode - 1 : media.episodes} /${media.episodes}**`] : []),
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
        if (showDescription && media.description) {
            embed.addField('Description', HandlerUtil.shortenMessage(media.description, { maxLength: 1024 }), false);
        } else if (media.bannerImage) {
            embed.setImage(media.bannerImage);
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
            .setTitle(studio.name)
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

    private static formatEnums(value: ModRole | MediaStatus): string {
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
            default: {
                console.log(`[support] unknown anilist enum value <${value}>`);
                return value;
            }
        }
    }
}
