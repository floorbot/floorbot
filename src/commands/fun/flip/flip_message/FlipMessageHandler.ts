import { ContextMenuHandler } from '../../../../discord/handler/abstracts/ContextMenuHandler';
import { FlipMessageCommandData } from './FlipMessageCommandData';
import { HandlerReply } from '../../../../helpers/HandlerReply';
import { ContextMenuInteraction, Util } from 'discord.js';
import { Flipper } from '../Flipper';

export class FlipMessageHandler extends ContextMenuHandler {

    constructor() {
        super({ group: 'Fun', global: false, nsfw: false, data: FlipMessageCommandData });
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
