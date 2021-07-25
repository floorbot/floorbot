import { BooruCustomData, BooruHandler } from '../../../..';
import { HandlerButton } from 'discord.js-commands';
import { Constants, Util, User } from 'discord.js';
const { MessageButtonStyles } = Constants;

export class BooruButtonFactory {

    public static getAgainButton(handler: BooruHandler, tags: string): HandlerButton<BooruCustomData> {
        return new HandlerButton(handler)
            .setLabel(tags ? 'Search Again' : 'Random Again')
            .setStyle(MessageButtonStyles.PRIMARY)
            .setCustomId({
                t: tags ? Util.splitMessage(tags, { maxLength: 40, char: '+' })[0]! : tags,
                wl: null,
                m: 'p'
            });
    }

    public static getRecycleButton(handler: BooruHandler, tags: string, user: User): HandlerButton<BooruCustomData> {
        return new HandlerButton(handler)
            .setLabel('♻️')
            .setStyle(MessageButtonStyles.SUCCESS)
            .setCustomId({
                t: tags ? Util.splitMessage(tags, { maxLength: 40, char: '+' })[0]! : tags,
                wl: user.id,
                m: 'e'
            });
    }

    public static getViewOnlineButton(handler: BooruHandler, postURL: string): HandlerButton<BooruCustomData> {
        return new HandlerButton(handler)
            .setURL(postURL)
            .setStyle(MessageButtonStyles.LINK)
            .setLabel('View Online')
    }
}
