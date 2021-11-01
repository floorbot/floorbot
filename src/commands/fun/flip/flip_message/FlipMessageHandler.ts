import { HandlerReply } from '../../../../components/HandlerReply';
import { FlipMessageCommandData } from './FlipMessageCommandData';
import { ContextMenuInteraction, Util } from 'discord.js';
import { BaseHandler } from '../../../BaseHandler';
import { Flipper } from '../Flipper';

export class FlipMessageHandler extends BaseHandler {

    constructor() {
        super({
            id: 'flip_message',
            group: 'Fun',
            global: false,
            nsfw: false,
            data: FlipMessageCommandData,
            description: 'Flip the target message text'
        })
    }

    public async execute(contextMenu: ContextMenuInteraction): Promise<any> {
        const text = contextMenu.options.getMessage('message', true).content;
        if (!text.length) return contextMenu.reply(HandlerReply.createMessageContentReply(contextMenu, 'flip'));
        await contextMenu.deferReply();
        const flipped = Flipper.flipText(text);
        const split = Util.splitMessage(flipped, { maxLength: 2000 })[0]!
        return contextMenu.followUp({ content: split, allowedMentions: { parse: [] } });
    }
}
