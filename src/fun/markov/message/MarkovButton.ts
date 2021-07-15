import { MessageButton, Channel, Constants } from 'discord.js';
import { ComponentCustomData } from 'discord.js-commands';
const { MessageButtonStyles } = Constants;

export enum MarkovButtonFunction {
    ENABLE = 'enable',
    DISABLE = 'disable',
    WIPE = 'wipe',
    WIPE_CONFIRMED = 'wipe_confirmed',
    PURGE_CONFIRMED = 'purge_confirmed',
    BACKOUT = 'backout'
}

export interface MarkovCustomData extends ComponentCustomData {
    readonly fn: MarkovButtonFunction,
    readonly channel: string,
    readonly wipe: boolean,
}

export class MarkovButton extends MessageButton {

    constructor(channel: Channel, fn: MarkovButtonFunction) {
        super();
        this.setCustomId(JSON.stringify({ id: 'markov', channel: channel.id, fn: fn }));

        switch (fn) {
            case MarkovButtonFunction.ENABLE: {
                this.setStyle(MessageButtonStyles.PRIMARY);
                this.setLabel(`Enable Markov`);
                break;
            }
            case MarkovButtonFunction.DISABLE: {
                this.setStyle(MessageButtonStyles.PRIMARY);
                this.setLabel(`Disable Markov`);
                break;
            }
            case MarkovButtonFunction.WIPE: {
                this.setStyle(MessageButtonStyles.DANGER);
                this.setLabel('Wipe Data');
                break;
            }
            case MarkovButtonFunction.WIPE_CONFIRMED: {
                this.setStyle(MessageButtonStyles.DANGER);
                this.setLabel('Confirm Wipe Data');
                break;
            }
            case MarkovButtonFunction.PURGE_CONFIRMED: {
                this.setStyle(MessageButtonStyles.DANGER);
                this.setLabel('Purge All Data');
                break;
            }
            case MarkovButtonFunction.BACKOUT: {
                this.setStyle(MessageButtonStyles.PRIMARY);
                this.setLabel('Backout');
                break;
            }
            default: throw fn;
        }
    }
}
