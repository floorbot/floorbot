import { HandlerButton } from '../../../../discord/components/HandlerButton';
import { MessageButton, MessageButtonOptions, Constants } from 'discord.js';

const { MessageButtonStyles } = Constants;

export enum MarkovButtonType {
    POSTING_ENABLE = 'Enable Posting',
    POSTING_DISABLE = 'Disable Posting',
    TRACKING_ENABLE = 'Enable Tracking',
    TRACKING_DISABLE = 'Disable Tracking',
    LINKS_ENABLE = 'Enable Links',
    LINKS_DISABLE = 'Disable Links',
    MENTIONS_ENABLE = 'Enable Mentions',
    MENTIONS_DISABLE = 'Disable Mentions',
    OWOIFY_ENABLE = 'Enable OwO',
    OWOIFY_DISABLE = 'Disable OwO',
    QUOTING_ENABLE = 'Enable Quoting',
    QUOTING_DISABLE = 'Disable Quoting',
    WIPE = 'Wipe Data',
    WIPE_CONFIRMED = 'Wipe Channel Data',
    PURGE_CONFIRMED = 'Purge All Guild Data',
    BACKOUT = 'Backout'
}

export class MarkovButton extends HandlerButton {

    constructor(data?: MessageButton | MessageButtonOptions) {
        super(data);
    }

    public static getMarkovButton(type: MarkovButtonType): MarkovButton {
        const button = new MarkovButton();
        button.setCustomId(type);
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
            case MarkovButtonType.OWOIFY_DISABLE:
            case MarkovButtonType.QUOTING_ENABLE:
            case MarkovButtonType.QUOTING_DISABLE: {
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
