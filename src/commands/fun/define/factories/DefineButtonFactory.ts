import { ButtonFactory } from 'discord.js-commands';
import { DefineHandler, DefineCustomData } from '../../../..';
import { Constants } from 'discord.js';
const { MessageButtonStyles } = Constants

export enum DefinePageButtonType {
    PREVIOUS = 'previous',
    NEXT = 'next'
}

export class DefineButtonFactory extends ButtonFactory<DefineCustomData, DefineHandler> {

    constructor(handler: DefineHandler) {
        super(handler);
    }

    public static getPageButton(handler: DefineHandler, type: DefinePageButtonType, defineData: DefineCustomData): DefineButtonFactory {
        const button = new DefineButtonFactory(handler).setStyle(MessageButtonStyles.PRIMARY);
        switch (type) {
            case DefinePageButtonType.PREVIOUS: {
                button.setLabel('Previous');
                button.setCustomId({ ...defineData, page: defineData.page - 1 });
                break;
            }
            case DefinePageButtonType.NEXT: {
                button.setLabel('Next');
                button.setCustomId({ ...defineData, page: defineData.page + 1 });
                break;
            }
            default: throw type;
        }
        return button;
    }
}
