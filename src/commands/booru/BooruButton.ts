import { HandlerButton, HandlerButtonID } from '../../components/HandlerButton';
import { MessageButton, MessageButtonOptions, Constants } from 'discord.js';

const { MessageButtonStyles } = Constants;

export const BooruButtonID = {
    ...HandlerButtonID, ...{
        REPEAT: 'repeat',
        RECYCLE: 'recycle'
    }
};

export class BooruButton extends HandlerButton {

    constructor(data?: MessageButton | MessageButtonOptions) {
        super(data);
    }

    public static createRepeatButton(tags: string): BooruButton {
        return new BooruButton()
            .setLabel(tags ? 'Search Again' : 'Random Again')
            .setStyle(MessageButtonStyles.PRIMARY)
            .setCustomId(BooruButtonID.REPEAT);
    }

    public static createRecycleButton(): BooruButton {
        return new BooruButton()
            .setLabel('♻️')
            .setStyle(MessageButtonStyles.SUCCESS)
            .setCustomId(BooruButtonID.RECYCLE);
    }
}
