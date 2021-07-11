import { BooruButton } from '../BooruButton';
import { BooruHandler } from '../../BooruHandler';
import { Constants, Util } from 'discord.js';
const { MessageButtonStyles } = Constants;

export class AgainButton extends BooruButton {

    constructor(handler: BooruHandler, tags: string) {
        super(handler);

        this.setLabel(tags ? 'Search Again' : 'Random Again')
        this.setStyle(MessageButtonStyles.PRIMARY)
        this.setCustomId({
            t: tags ? Util.splitMessage(tags, { maxLength: 40, char: '+' })[0] : tags,
            wl: null,
            m: 'p'
        });
    }
}
