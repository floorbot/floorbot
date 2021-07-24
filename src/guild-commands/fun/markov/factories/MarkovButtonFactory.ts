import { MarkovHandler, MarkovCustomData, MarkovButtonType } from '../../../..';
import { ButtonFactory, HandlerButton } from 'discord.js-commands';
import { GuildChannel, Constants } from 'discord.js';
const { MessageButtonStyles } = Constants;

export class MarkovButtonFactory extends ButtonFactory<MarkovCustomData, MarkovHandler> {

    constructor(handler: MarkovHandler) {
        super(handler);

    }

    public getMarkovButton(channel: GuildChannel, type: MarkovButtonType): HandlerButton<MarkovCustomData, MarkovHandler> {
        const button = new HandlerButton(this.handler);
        button.setCustomId({ channel: channel.id, type: type });
        button.setLabel(type);
        switch (type) {
            case MarkovButtonType.BACKOUT:
            case MarkovButtonType.POSTING_ENABLE:
            case MarkovButtonType.POSTING_DISABLE:
            case MarkovButtonType.TRACKING_ENABLE:
            case MarkovButtonType.TRACKING_DISABLE: {
                return button.setStyle(MessageButtonStyles.PRIMARY);
            }
            case MarkovButtonType.LINKS_ENABLE:
            case MarkovButtonType.LINKS_DISABLE:
            case MarkovButtonType.MENTIONS_ENABLE:
            case MarkovButtonType.MENTIONS_DISABLE: {
                return button.setStyle(MessageButtonStyles.SECONDARY);
            }
            case MarkovButtonType.WIPE:
            case MarkovButtonType.WIPE_CONFIRMED:
            case MarkovButtonType.PURGE_CONFIRMED: {
                return button.setStyle(MessageButtonStyles.DANGER);
            }
            default: throw type;
        }
    }
}
