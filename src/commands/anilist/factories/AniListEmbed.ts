import { HandlerEmbed } from 'discord.js-commands';
import { MessageEmbed, MessageEmbedOptions, ColorResolvable } from 'discord.js';
import { Page, PageInfo } from '../api/interfaces/Common';
import { Media } from '../api/AniListAPI';
import { AniListCustomData } from '../AniListHandler';

export class AniListEmbed extends HandlerEmbed {

    constructor(data?: MessageEmbed | MessageEmbedOptions) {
        super(data);
        this.setFooter();
    }

    public override setTitle(scope: string | AniListCustomData | Page): this {
        if (typeof scope === 'string') return super.setTitle(scope);
        if ('query' in scope) return super.setTitle(scope.query.toString());

        if (scope.media && scope.media.length) {
            const media = scope.media[0]!;
            const mediaTitle = media.title ? media.title.userPreferred || media.title.romaji || media.title.english || media.title.native! : 'Unknown Title';
            const mediaIconURL = media.coverImage ? media.coverImage.large || media.coverImage.medium : undefined;
            const mediaURL = media.siteUrl ? media.siteUrl : undefined;
            return super.setAuthor(mediaTitle, iconURL || mediaIconURL, url || mediaURL);
        }
        return this;
    }

    public override setAuthor(scope: string | Page, iconURL?: string, url?: string): this {
        if (typeof scope === 'string') return super.setAuthor(scope, iconURL, url);
        if (scope.media && scope.media.length) {
            const media = scope.media[0]!;
            const mediaTitle = media.title ? media.title.userPreferred || media.title.romaji || media.title.english || media.title.native! : 'Unknown Title';
            const mediaIconURL = media.coverImage ? media.coverImage.large || media.coverImage.medium : undefined;
            const mediaURL = media.siteUrl ? media.siteUrl : undefined;
            return super.setAuthor(mediaTitle, iconURL || mediaIconURL, url || mediaURL);
        }
        return this;
    }

    public override setColor(scope: ColorResolvable | Media): this {
        if (scope instanceof Array) return super.setColor(scope);
        if (typeof scope === 'string') return super.setColor(scope);
        if (typeof scope === 'number') return super.setColor(scope);
        if (scope.coverImage && scope.coverImage.color) {
            super.setColor(parseInt(scope.coverImage.color.substring(1), 16))
        }
        return this;
    };

    public override setFooter(scope?: string | PageInfo, iconURL?: string): this {
        iconURL = iconURL ?? 'https://anilist.co/img/icons/android-chrome-512x512.png';
        if (!scope) return super.setFooter('Powered by AniList', iconURL)
        if (typeof scope === 'string') return super.setFooter(scope, iconURL)
        return super.setFooter(`${scope.currentPage}/${scope.total} Powered by AniList`, iconURL);
    }
}
