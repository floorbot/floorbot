import { MessageButton, Channel, Constants } from 'discord.js';
import { ComponentCustomData } from 'discord.js-commands';
const { MessageButtonStyles } = Constants;

export interface MarkovCustomData extends ComponentCustomData {
    readonly fn: 'enable' | 'disable' | 'wipe' | 'cancel' | 'purge-confirm' | 'purge-backout',
    readonly channel: string,
    readonly wipe: boolean,
}

export class MarkovButton extends MessageButton {

    constructor(channel: Channel, fn: 'enable' | 'disable' | 'wipe' | 'cancel' | 'purge-confirm' | 'purge-backout', wipe: boolean = false) {
        super();
        this.setCustomId(JSON.stringify({ id: 'markov', channel: channel.id, fn: fn, wipe: wipe }));

        if (fn === 'enable') {
            this.setStyle(wipe ? MessageButtonStyles.DANGER : MessageButtonStyles.SUCCESS);
            this.setLabel(`Enable ${wipe ? 'and Wipe' : ''}`);
        }

        if (fn === 'disable') {
            this.setStyle(wipe ? MessageButtonStyles.DANGER : MessageButtonStyles.SUCCESS);
            this.setLabel(`Disable ${wipe ? 'and Wipe' : ''}`);
        }

        if (fn === 'wipe') {
            this.setStyle(MessageButtonStyles.DANGER);
            this.setLabel('Wipe');
        }

        if (fn === 'cancel') {
            this.setStyle(MessageButtonStyles.PRIMARY);
            this.setLabel('Cancel');
        }

        if (fn === 'purge-confirm') {
            this.setStyle(MessageButtonStyles.DANGER);
            this.setLabel('Purge and Delete');
        }

        if (fn === 'purge-backout') {
            this.setStyle(MessageButtonStyles.PRIMARY);
            this.setLabel('Backout');
        }
    }
}
