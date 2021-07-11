import { BooruButton } from '../BooruButton';
import { Constants, User, Util } from 'discord.js';
import { BooruHandler } from '../../BooruHandler';
const { MessageButtonStyles } = Constants;

export class RecycleButton extends BooruButton {

    constructor(handler: BooruHandler, tags: string, user: User) {
        super(handler);

        this.setLabel('♻️')
        this.setStyle(MessageButtonStyles.SUCCESS)
        this.setCustomId({
            t: tags ? Util.splitMessage(tags, { maxLength: 40, char: '+' })[0] : tags,
            wl: user.id,
            m: 'e'
        });
    }
}
