import { MarkovHandler, MarkovCustomData, MarkovButtonType } from '../../../..';
import { GuildChannel, Constants } from 'discord.js';
import { ButtonFactory } from 'discord.js-commands';
const { MessageButtonStyles } = Constants;

export class MarkovButtonFactory extends ButtonFactory<MarkovCustomData, MarkovHandler> {
    constructor(handler: MarkovHandler, channel: GuildChannel, type: MarkovButtonType) {
        super(handler);
        this.setCustomId({ channel: channel.id, type: type });

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
