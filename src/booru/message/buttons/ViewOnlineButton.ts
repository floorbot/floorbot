import { MessageButton, Constants } from 'discord.js';
const { MessageButtonStyles } = Constants;

export class ViewOnlineButton extends MessageButton {

    constructor(postURL: string) {
        super();
        this.setURL(postURL);
        this.setStyle(MessageButtonStyles.LINK);
        this.setLabel('View Online');
    }
}
