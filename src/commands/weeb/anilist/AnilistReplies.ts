import { AniListResponse, Character, FuzzyDate, Media, MediaRankType, PageInfo, Staff } from '../../../apis/anilist/AniListAPI.js';
import { Interaction, InteractionReplyOptions, Message, MessageActionRow, Util } from 'discord.js';
import { HandlerButton } from '../../../discord/components/HandlerButton.js';
import { HandlerEmbed } from '../../../discord/components/HandlerEmbed.js';
import { HandlerUtil } from '../../../discord/handler/HandlerUtil.js';
import { HandlerReplies } from '../../../helpers/HandlerReplies.js';
import { AniListSubCommand } from './AniListCommandData.js';
import { DateTime } from 'luxon';

export class AniListReplies extends HandlerReplies {

    public override createEmbedTemplate(context: Interaction | Message, pageInfo?: PageInfo): HandlerEmbed {
        const embed = super.createEmbedTemplate(context)
            .setFooter('Powered by AniList', 'https://anilist.co/img/icons/android-chrome-512x512.png');
        if (pageInfo) {
            const { currentPage, total } = pageInfo;
            if (currentPage && total && total > 1) embed.setFooter(`${currentPage}/${total} Powered by AniList`, 'https://anilist.co/img/icons/android-chrome-512x512.png');
        }
        return embed;
    }

    public createAniListReply(context: Interaction | Message, subCommand: AniListSubCommand, res: AniListResponse): InteractionReplyOptions {
        if (res.errors) return this.createAniListErrorReply(context, res);
        switch (subCommand) {
            case AniListSubCommand.MEDIA: {
                const { media, pageInfo } = res.data.Page || {};
                if (!media || !media[0]) return this.createAniListErrorReply(context, res);
                return this.createMediaReply(context, media[0], pageInfo);
            }
            case AniListSubCommand.CHARACTER: {
                const { characters, pageInfo } = res.data.Page || {};
                if (!characters || !characters[0]) return this.createAniListErrorReply(context, res);
                return this.createCharacterReply(context, characters[0], pageInfo);
            }
            case AniListSubCommand.STAFF: {
                const { staff, pageInfo } = res.data.Page || {};
                if (!staff || !staff[0]) return this.createAniListErrorReply(context, res);
                return this.createStaffReply(context, staff[0], pageInfo);
            }
        }
    }

    public createAniListErrorReply(context: Interaction | Message, res: AniListResponse): InteractionReplyOptions {
        console.error('[anilist] There was an anilist error...', res);
        const attachment = this.getAvatar('1-3');
        const embed = this.createEmbedTemplate(context)
            .setTitle('AniList Error')
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription(res.errors && res.errors[0] ? res.errors[0].message : 'Unknown reason...');
        return { embeds: [embed], files: [attachment] };
    }

    public createMediaReply(context: Interaction | Message, media: Media, pageInfo?: PageInfo) {
        const embed = this.createMediaEmbed(context, media, pageInfo);
        const actionRow = new MessageActionRow().addComponents([
            ...(media.siteUrl ? [HandlerButton.createViewOnlineButton(media.siteUrl)] : []),
            HandlerButton.createPreviousPageButton(),
            HandlerButton.createNextPageButton()
        ]);
        const hasPages = pageInfo && pageInfo.total && pageInfo.total > 1;
        return { embeds: [embed], components: hasPages ? [actionRow] : [] };
    }

    public createCharacterReply(context: Interaction | Message, character: Character, pageInfo?: PageInfo): InteractionReplyOptions {
        const embed = this.createCharacterEmbed(context, character, pageInfo);
        const actionRow = new MessageActionRow().addComponents([
            ...(character.siteUrl ? [HandlerButton.createViewOnlineButton(character.siteUrl)] : []),
            HandlerButton.createPreviousPageButton(),
            HandlerButton.createNextPageButton()
        ]);
        const hasPages = pageInfo && pageInfo.total && pageInfo.total > 1;
        return { embeds: [embed], components: hasPages ? [actionRow] : [] };
    }

    public createStaffReply(context: Interaction | Message, staff: Staff, pageInfo?: PageInfo): InteractionReplyOptions {
        const embed = this.createStaffEmbed(context, staff, pageInfo);
        const actionRow = new MessageActionRow().addComponents([
            ...(staff.siteUrl ? [HandlerButton.createViewOnlineButton(staff.siteUrl)] : []),
            HandlerButton.createPreviousPageButton(),
            HandlerButton.createNextPageButton()
        ]);
        const hasPages = pageInfo && pageInfo.total && pageInfo.total > 1;
        return { embeds: [embed], components: hasPages ? [actionRow] : [] };
    }

    public createMediaEmbed(context: Interaction | Message, media: Media, pageInfo?: PageInfo, showDescription?: boolean): HandlerEmbed {
        const embed = this.createEmbedTemplate(context, pageInfo);
        const popularity = media.rankings ? media.rankings.find(ranking => ranking.allTime && ranking.type === MediaRankType.POPULAR) : undefined;
        const rated = media.rankings ? media.rankings.find(ranking => ranking.allTime && ranking.type === MediaRankType.RATED) : undefined;
        const nextAiring = media.nextAiringEpisode;
        const mainStudioEdge = media.studios && media.studios.edges ? media.studios.edges.find(edge => edge.isMain) : null;
        const mainStudio = mainStudioEdge ? mainStudioEdge.node ?? null : null;
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
        embed.addField(`Info [${HandlerUtil.capitalizeString(media.type || 'unknown')}]`, [
            ...(media.status ? [`Status: ** ${HandlerUtil.capitalizeString(media.status)}** `] : []),
            ...(media.nextAiringEpisode ? [`Airing: ** <t:${Math.round(new DateTime().plus({ seconds: media.nextAiringEpisode.timeUntilAiring }).toSeconds())}: R >** `] : []),
            `Score: ** ${rated ? `(#${rated.rank}) ` : ''}${media.averageScore ? HandlerUtil.formatCommas(media.averageScore) : 'N/A'}** `,
            `Popularity: ** ${popularity ? `(#${popularity.rank}) ` : ''}${media.popularity ? HandlerUtil.formatCommas(media.popularity) : 'N/A'}** `,
            ...(media.format ? [`Format: ** ${HandlerUtil.capitalizeString(media.format)}** `] : []),
            ...(media.source ? [`Source: ** ${HandlerUtil.capitalizeString(media.source)}** `] : []),
            ...(mainStudio ? mainStudio.siteUrl ?
                [`Studio: ** [${mainStudio.name}](${mainStudio.siteUrl}) ** `] :
                [`Studio: ** ${mainStudio.name}** `] : []),
            ...(media.trailer && trailerUrl ? [`Trailer: ** [${media.trailer.site}](${trailerUrl}) ** `] : [])
        ].join('\n'), true);
        embed.addField('\u200b', ([
            ...(media.episodes ? [`Episodes: ** ${nextAiring ? nextAiring.episode - 1 : media.episodes} /${media.episodes}**`] : []),
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
        return embed;
    }

    public createCharacterEmbed(context: Interaction | Message, character: Character, pageInfo?: PageInfo): HandlerEmbed {
        const dateOfBirth = character.dateOfBirth ? AniListReplies.getFuzzyDateString(character.dateOfBirth, true) : null;
        const embed = this.createEmbedTemplate(context, pageInfo)
            .setTitle(character.name ? (character.name.full || Object.values(character.name)[0] || 'Unknown name') : 'Unknown name')
            .setDescription([
                `Names: **${Object.values(character.name || {}).filter(name => name).join(', ') || `*unknown*`}**`,
                `Favourites: **${character.favourites ? HandlerUtil.formatCommas(character.favourites) : '*unknown*'}**`,
                `Gender: **${character.gender || '*unknown*'}**`,
                `Age: **${(character.age || '*unknown*').split('-').filter(part => part).join('-')}**`,
                `Birthday: **${dateOfBirth || '*unknown*'}**`,
                `Blood Type: **${character.bloodType || '*unknown*'}**`
            ]);
        if (character.siteUrl) embed.setURL(character.siteUrl);
        if (character.image) embed.setThumbnail(character.image.large || character.image.medium!);
        return embed;
    }

    public createStaffEmbed(context: Interaction | Message, staff: Staff, pageInfo?: PageInfo): HandlerEmbed {
        const dateOfBirth = staff.dateOfBirth && staff.dateOfBirth.year ? AniListReplies.getFuzzyDateString(staff.dateOfBirth) : null;
        const dateOfDeath = staff.dateOfDeath && staff.dateOfDeath.year ? AniListReplies.getFuzzyDateString(staff.dateOfDeath) : null;
        const [startYear, endYear] = staff.yearsActive || [];
        const totalMedia = staff.staffMedia?.pageInfo?.total || 0;
        const totalCharacters = staff.characters?.pageInfo?.total || 0;
        const embed = this.createEmbedTemplate(context, pageInfo)
            .setTitle(staff.name ? (staff.name.full || Object.values(staff.name)[0] || 'Unknown name') : 'Unknown name')
            .setDescription([
                `Names: **${Object.values(staff.name || {}).filter(name => name).join(', ') || `*unknown*`}**`,
                `Favourites: **${staff.favourites ? HandlerUtil.formatCommas(staff.favourites) : '*unknown*'}**`,
                ...(staff.age ? [`Age: **${staff.age}**`] : []),
                ...(staff.gender ? [`Age: **${staff.gender}**`] : []),
                ...(staff.dateOfBirth && dateOfBirth ? [`Born: **${dateOfBirth}**`] : []),
                ...(staff.dateOfDeath && dateOfDeath ? [`Died: **${dateOfDeath}**`] : []),
                ...(staff.bloodType ? [`Blood Type: **${staff.bloodType}**`] : []),
                ...(staff.languageV2 ? [`Language: **${staff.languageV2}**`] : []),
                ...(staff.primaryOccupations ? [`Occupation: **${staff.primaryOccupations}**`] : []),
                ...(staff.homeTown ? [`Home Town: **${staff.homeTown}**`] : []),
                ...(staff.yearsActive && startYear ? [`Years Active: **${startYear} - ${endYear || 'current'}**`] : []),
                ...(totalCharacters ? [`Total Media: **${HandlerUtil.formatCommas(totalCharacters)}**`] : []),
                ...(totalMedia ? [`Total Characters: **${HandlerUtil.formatCommas(totalMedia)}**`] : [])
            ]);
        if (staff.siteUrl) embed.setURL(staff.siteUrl);
        if (staff.image) embed.setThumbnail(staff.image.large || staff.image.medium!);
        return embed;
    }

    public static reduceDescription(description: string) {
        return Util.splitMessage(description.replace(/<\/?[^>]+(>|$)/g, ''), { char: ' ', append: '...', maxLength: 1024 })[0]!;
    }

    public static getFuzzyDateString(fuzzy: FuzzyDate, string?: boolean) {
        if (!string) return `<t:${Math.round(DateTime.fromObject(fuzzy).toSeconds())}:d>`;
        const date = new Date();
        if (fuzzy.day && fuzzy.month && fuzzy.year) {
            date.setDate(fuzzy.day);
            date.setMonth(fuzzy.month - 1);
            date.setFullYear(fuzzy.year);
            return `<t:${Math.round(date.getTime() / 1000)}:D>`;
        } else if (!fuzzy.day && !fuzzy.month && !fuzzy.month) {
            return 'unknown';
        } else {
            var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            return [fuzzy.month ? months[fuzzy.month - 1] : null, fuzzy.day, fuzzy.year].filter(part => part || part === 0).join(' ');
        }
    }
}
