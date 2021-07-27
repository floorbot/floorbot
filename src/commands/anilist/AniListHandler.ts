import { HandlerContext, HandlerCustomData, HandlerEmbed } from 'discord.js-commands';
import { GuildHandler, GuildHandlerOptions } from '../..';

export interface AniListCustomData extends HandlerCustomData {

}

export class AniListHandler<T extends AniListCustomData> extends GuildHandler<T> {

    constructor(options: GuildHandlerOptions) {
        super(options);
    }

    public override getEmbedTemplate(_context: HandlerContext, _customData?: T): HandlerEmbed {
        return new HandlerEmbed().setFooter('Powered by AniList', 'https://anilist.co/img/icons/android-chrome-512x512.png');
    }
}
