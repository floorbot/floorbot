import { AnimeCustomData, AnimeHandler } from '../handlers/AnimeHandler';
import { HandlerButton } from 'discord.js-commands';
import { Constants } from 'discord.js'
const { MessageButtonStyles } = Constants;

export class AniListButtonFactory {

    public static getViewOnlineButton(handler: AnimeHandler, siteUrl: string): HandlerButton<AnimeCustomData> {
        return new HandlerButton(handler)
            .setStyle(MessageButtonStyles.LINK)
            .setLabel('View Online')
            .setURL(siteUrl);
    }
}
