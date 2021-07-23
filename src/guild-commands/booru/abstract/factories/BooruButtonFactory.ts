import { ButtonFactory, HandlerButton } from 'discord.js-commands';
import { BooruCustomData, BooruHandler } from '../../../..';
import { Constants, Util, User } from 'discord.js';
const { MessageButtonStyles } = Constants;

export class BooruButtonFactory extends ButtonFactory<BooruCustomData, BooruHandler> {

    constructor(handler: BooruHandler) {
        super(handler);
    }

    public getAgainButton(tags: string): HandlerButton<BooruCustomData, BooruHandler> {
        return new HandlerButton(this.handler)
            .setLabel(tags ? 'Search Again' : 'Random Again')
            .setStyle(MessageButtonStyles.PRIMARY)
            .setCustomId({
                t: tags ? Util.splitMessage(tags, { maxLength: 40, char: '+' })[0]! : tags,
                wl: null,
                m: 'p'
            });
    }

    public getRecycleButton(tags: string, user: User): HandlerButton<BooruCustomData, BooruHandler> {
        return new HandlerButton(this.handler)
            .setLabel('♻️')
            .setStyle(MessageButtonStyles.SUCCESS)
            .setCustomId({
                t: tags ? Util.splitMessage(tags, { maxLength: 40, char: '+' })[0]! : tags,
                wl: user.id,
                m: 'e'
            });
    }

    public getViewOnlineButton(postURL: string): HandlerButton<BooruCustomData, BooruHandler> {
        return new HandlerButton(this.handler)
            .setURL(postURL)
            .setStyle(MessageButtonStyles.LINK)
            .setLabel('View Online')
    }
}
