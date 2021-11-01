import { HandlerReply } from '../../../../components/HandlerReply';
import { FlipMessageCommandData } from './FlipMessageCommandData';
import { ContextMenuInteraction } from 'discord.js';
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
        if (!text.length) return contextMenu.reply(HandlerReply.createInvalidInputReply(contextMenu, 'It looks like that message is has no content to flip'));
        await contextMenu.deferReply();
        const flipped = Flipper.flipText(text);
        return contextMenu.followUp({ content: flipped, allowedMentions: { parse: [] } });
    }
}
