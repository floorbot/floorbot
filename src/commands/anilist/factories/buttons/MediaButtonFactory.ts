import { AnimeHandler, AnimeCustomData } from '../../handlers/AnimeHandler';
import { AniListButtonFactory } from '../AniListButtonFactory';
import { HandlerButton } from 'discord.js-commands';
import { Page } from '../../api/interfaces/Common';
import { Constants } from 'discord.js';
const { MessageButtonStyles } = Constants;

export class MediaButtonFactory extends AniListButtonFactory {

    public static getMediaPageNextButton(handler: AnimeHandler, page: Page, customData: AnimeCustomData): HandlerButton<AnimeCustomData> {
        const p = customData.page! + 1 === page.pageInfo.total! ? -1 : customData.page!;
        return new HandlerButton(handler)
            .setCustomId({ sub: 'page', search: customData.search, perPage: customData.perPage, page: p + 1 })
            .setStyle(MessageButtonStyles.PRIMARY)
            .setLabel(`>`);
    }

    public static getMediaPagePreviousButton(handler: AnimeHandler, page: Page, customData: AnimeCustomData): HandlerButton<AnimeCustomData> {
        const p = customData.page || page.pageInfo.total!;
        return new HandlerButton(handler)
            .setCustomId({ sub: 'page', search: customData.search, perPage: customData.perPage, page: p - 1 })
            .setStyle(MessageButtonStyles.PRIMARY)
            .setLabel(`<`);
    }

    public static getDescriptionButton(handler: AnimeHandler, customData: AnimeCustomData): HandlerButton<AnimeCustomData> {
        return new HandlerButton(handler)
            .setCustomId({ ...customData, desc: !customData.desc })
            .setStyle(MessageButtonStyles.SUCCESS)
            .setLabel(customData.desc ? 'Hide Description' : 'Show Description')
    }
}
