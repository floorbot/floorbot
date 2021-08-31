import { AniListCustomData, AniListHandler } from '../AniListHandler';
import { Connection, Page } from '../api/interfaces/Common';
import { HandlerButton } from 'discord.js-commands';
import { Constants, Util } from 'discord.js'
const { MessageButtonStyles } = Constants;

export class AniListButtonFactory {

    public static getPlusButton(handler: AniListHandler, customData: AniListCustomData): HandlerButton<AniListCustomData> {
        return new HandlerButton(handler)
            .setCustomId({ ...customData, plus: true })
            .setStyle(MessageButtonStyles.SUCCESS)
            .setLabel(`+`);
    }

    public static getNextPageButton(handler: AniListHandler, customData: AniListCustomData, page: Page): HandlerButton<AniListCustomData> {
        const pageInfo = page.pageInfo!;
        return new HandlerButton(handler)
            .setCustomId({ ...customData, page: pageInfo.hasNextPage ? pageInfo.currentPage! + 1 : 1 })
            .setStyle(MessageButtonStyles.PRIMARY)
            .setLabel(`>`);
    }

    public static getPreviousPageButton(handler: AniListHandler, customData: AniListCustomData, page: Page): HandlerButton<AniListCustomData> {
        const pageInfo = page.pageInfo!;
        return new HandlerButton(handler)
            .setCustomId({ ...customData, page: (pageInfo.currentPage! - 1) || pageInfo.lastPage! })
            .setStyle(MessageButtonStyles.PRIMARY)
            .setLabel(`<`);
    }

    public static getConnectionButton(handler: AniListHandler, customData: AniListCustomData, edge: AniListCustomData['edge']): HandlerButton<AniListCustomData> {
        return new HandlerButton(handler)
            .setCustomId({ ...customData, edge: edge })
            .setStyle(MessageButtonStyles.PRIMARY)
            .setLabel(Util.capitalizeString(edge!));
    }

    public static getNextConnectionButton(handler: AniListHandler, customData: AniListCustomData, connection: Connection<any, any>): HandlerButton<AniListCustomData> {
        const pageInfo = connection.pageInfo!;
        return new HandlerButton(handler)
            .setCustomId({ ...customData, page: pageInfo.hasNextPage ? pageInfo.currentPage! + 1 : 1 })
            .setStyle(MessageButtonStyles.PRIMARY)
            .setLabel(`>`);
    }

    public static getPreviousEdgeButton(handler: AniListHandler, customData: AniListCustomData, connection: Connection<any, any>): HandlerButton<AniListCustomData> {
        const pageInfo = connection.pageInfo!;
        return new HandlerButton(handler)
            .setCustomId({ ...customData, page: (pageInfo.currentPage! - 1) || pageInfo.lastPage! })
            .setStyle(MessageButtonStyles.PRIMARY)
            .setLabel(`<`);
    }

    public static getDescriptionButton(handler: AniListHandler, customData: AniListCustomData): HandlerButton<AniListCustomData> {
        return new HandlerButton(handler)
            .setCustomId({ ...customData, display: customData.display === 'desc' ? 'banner' : 'desc' })
            .setStyle(MessageButtonStyles.SUCCESS)
            .setLabel(customData.display === 'desc' ? 'Hide Description' : 'Show Description')
    }

    public static getViewOnlineButton(handler: AniListHandler, siteUrl: string): HandlerButton<AniListCustomData> {
        return new HandlerButton(handler)
            .setStyle(MessageButtonStyles.LINK)
            .setLabel('View Online')
            .setURL(siteUrl);
    }
}
