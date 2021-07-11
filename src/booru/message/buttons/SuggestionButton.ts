import { BooruHandler } from '../../BooruHandler';
import { BooruButton } from '../BooruButton';
import { Constants, User } from 'discord.js';
const { MessageButtonStyles } = Constants;

export class SuggestionButton extends BooruButton {

    constructor(handler: BooruHandler, tag: string, user: User) {
        super(handler);

        this.setLabel(tag)
        this.setStyle(MessageButtonStyles.SECONDARY)
        this.setCustomId({
            t: tag,
            wl: user.id,
            m: 'e'
        });
    }
}
