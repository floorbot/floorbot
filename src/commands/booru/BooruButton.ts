import { MessageButton, MessageButtonOptions, Constants } from 'discord.js';
import { HandlerButton } from '../../components/HandlerButton';

const { MessageButtonStyles } = Constants;

export class BooruButton extends HandlerButton {

    constructor(data?: MessageButton | MessageButtonOptions) {
        super(data);
    }

    public static createRepeatButton(tags: string): BooruButton {
        return new BooruButton()
            .setLabel(tags ? 'Search Again' : 'Random Again')
            .setStyle(MessageButtonStyles.PRIMARY)
            .setCustomId('repeat');
    }

    public static createRecycleButton(): BooruButton {
        return new BooruButton()
            .setLabel('♻️')
            .setStyle(MessageButtonStyles.SUCCESS)
            .setCustomId('recycle');
    }

    public static createDeleteButton(): BooruButton {
        return new BooruButton()
            .setLabel('✖️')
            .setStyle(MessageButtonStyles.DANGER)
            .setCustomId('delete');
    }

    public static createViewOnlineButton(postURL: string): BooruButton {
        return new BooruButton()
            .setURL(postURL)
            .setStyle(MessageButtonStyles.LINK)
            .setLabel('View Online')
    }
}
