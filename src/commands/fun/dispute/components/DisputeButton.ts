import { HandlerButton, HandlerButtonID } from '../../../../discord/helpers/components/HandlerButton.js';
import { Constants, MessageButton, MessageButtonOptions } from 'discord.js';

const { MessageButtonStyles } = Constants;

export const DisputeButtonID = {
    ...HandlerButtonID, ...{
        YES: 'yes',
        NO: 'no'
    }
};

export class DisputeButton extends HandlerButton {

    constructor(data?: MessageButton | MessageButtonOptions) {
        super(data);
    }

    public static createDisputeButton(display: string): DisputeButton {
        const button = new DisputeButton().setCustomId(display);
        switch (display) {
            case DisputeButtonID.YES:
                button.setStyle(MessageButtonStyles.SUCCESS);
                button.setLabel('Yes');
                break;
            case DisputeButtonID.NO:
                button.setStyle(MessageButtonStyles.DANGER);
                button.setLabel('No');
                break;
            default: throw display;
        }
        return button;
    }
}
