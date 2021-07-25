import { DefineHandler, DefineCustomData } from '../../../..';
import { HandlerButton } from 'discord.js-commands';
import { Constants } from 'discord.js';
const { MessageButtonStyles } = Constants

export class DefineButtonFactory {

    public static getNextPageButton(handler: DefineHandler, query: string, page: number): HandlerButton<DefineCustomData> {
        return new HandlerButton(handler)
            .setLabel('Next')
            .setStyle(MessageButtonStyles.PRIMARY)
            .setCustomId({ id: handler.id, query: query, page: page + 1 });
    }

    public static getPreviousPageButton(handler: DefineHandler, query: string, page: number): HandlerButton<DefineCustomData> {
        return new HandlerButton(handler)
            .setLabel('Previous')
            .setStyle(MessageButtonStyles.PRIMARY)
            .setCustomId({ id: handler.id, query: query, page: page - 1 })
    }
}
