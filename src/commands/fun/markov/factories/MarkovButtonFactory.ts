import { MarkovHandler, MarkovCustomData, MarkovButtonType } from '../../../..';
import { GuildChannel, Constants } from 'discord.js';
import { HandlerButton } from 'discord.js-commands';
const { MessageButtonStyles } = Constants;

export class MarkovButtonFactory {

    public static getMarkovButton(handler: MarkovHandler, channel: GuildChannel, type: MarkovButtonType): HandlerButton<MarkovCustomData> {
        const button = new HandlerButton(handler);
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
            case MarkovButtonType.MENTIONS_DISABLE:
            case MarkovButtonType.OWOIFY_ENABLE:
            case MarkovButtonType.OWOIFY_DISABLE: {
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
