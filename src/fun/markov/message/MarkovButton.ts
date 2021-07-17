import { MessageButton, Channel, Constants } from 'discord.js';
import { ComponentCustomData } from 'discord.js-commands';
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
    WIPE = 'Wipe Data',
    WIPE_CONFIRMED = 'Confirm Wipe Data',
    PURGE_CONFIRMED = 'Purge All Data',
    BACKOUT = 'Backout'
}

export interface MarkovCustomData extends ComponentCustomData {
    readonly type: MarkovButtonType,
    readonly channel: string,
    readonly wipe: boolean,
}

export class MarkovButton extends MessageButton {

    constructor(channel: Channel, type: MarkovButtonType) {
        super();
        this.setCustomId(JSON.stringify({ id: 'markov', channel: channel.id, type: type }));

        this.setLabel(type);
        switch (type) {
            case MarkovButtonType.BACKOUT:
            case MarkovButtonType.POSTING_ENABLE:
            case MarkovButtonType.POSTING_DISABLE:
            case MarkovButtonType.TRACKING_ENABLE:
            case MarkovButtonType.TRACKING_DISABLE: {
                this.setStyle(MessageButtonStyles.PRIMARY);
                break;
            }
            case MarkovButtonType.LINKS_ENABLE:
            case MarkovButtonType.LINKS_DISABLE:
            case MarkovButtonType.MENTIONS_ENABLE:
            case MarkovButtonType.MENTIONS_DISABLE: {
                this.setStyle(MessageButtonStyles.SECONDARY);
                break;
            }
            case MarkovButtonType.WIPE:
            case MarkovButtonType.WIPE_CONFIRMED:
            case MarkovButtonType.PURGE_CONFIRMED: {
                this.setStyle(MessageButtonStyles.DANGER);
                break;
            }
            default: throw type;
        }
    }
}
