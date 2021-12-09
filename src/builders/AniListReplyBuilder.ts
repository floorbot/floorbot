import { AniListError, AniListResponse, Character, FuzzyDate, Media, MediaRankType, Page, PageInfo, Staff } from "../apis/anilist/AniListAPI.js";
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

    public addAniListEmbeds(res: AniListResponse): this {
        if (res.errors) {
            res.errors.forEach(error => this.addAniListErrorEmbed(error));
        } else if (res.data) {
            const { Media, Character, Staff, Page } = res.data;
            if (Media) { this.addMediaEmbed(Media); }
            if (Character) { this.addCharacterEmbed(Character); }
            if (Staff) { this.addStaffEmbed(Staff); }
            if (Page) {
                const { media, characters, staff, pageInfo } = Page;
                if (media) { media.forEach(media => this.addMediaEmbed(media, pageInfo)); }
                if (characters) { characters.forEach(character => this.addCharacterEmbed(character, pageInfo)); }
                if (staff) { staff.forEach(staff => this.addStaffEmbed(staff, pageInfo)); }
            }
        }
        return this;
    }

    public addAniListPageActionRow(Page: Page): this {
        const siteURLs: string[] = [];
        const { media, characters, staff, pageInfo } = Page;
        if (media) { media.forEach(media => { if (media.siteUrl) siteURLs.push(media.siteUrl); }); }
        if (characters) { characters.forEach(character => { if (character.siteUrl) siteURLs.push(character.siteUrl); }); }
        if (staff) { staff.forEach(staff => { if (staff.siteUrl) siteURLs.push(staff.siteUrl); }); }
        const siteURL = siteURLs.length === 1 ? siteURLs[0] : undefined;
        const totalPages = pageInfo ? pageInfo.total || 0 : 0;
        return this.addPageActionRow(siteURL, undefined, totalPages <= 1);
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
        this.addAttachment(attachment);
        this.addEmbed(embed);
        return this;
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
                ...(totalCharacters ? [`Total Media: **${HandlerUtil.formatCommas(totalCharacters)}**`] : []),
                ...(totalMedia ? [`Total Characters: **${HandlerUtil.formatCommas(totalMedia)}**`] : [])
            ]);
        if (staff.siteUrl) embed.setURL(staff.siteUrl);
        if (staff.image) embed.setThumbnail(staff.image.large || staff.image.medium!);
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
}
