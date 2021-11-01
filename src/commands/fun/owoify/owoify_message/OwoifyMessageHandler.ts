import { OwoifyMessageCommandData } from './OwoifyMessageCommandData';
import { HandlerReply } from '../../../../components/HandlerReply';
import { ContextMenuInteraction, Util } from 'discord.js';
import { BaseHandler } from '../../../BaseHandler';
import * as owoify from 'owoify-js';

export class OwoifyMessageHandler extends BaseHandler {

    constructor() {
        super({
            id: 'owoify_message',
            group: 'Fun',
            global: false,
            nsfw: false,
            data: OwoifyMessageCommandData,
            description: `owo what's this?`
        })
    }

    public async execute(contextMenu: ContextMenuInteraction): Promise<any> {
        const text = contextMenu.options.getMessage('message', true).content;
        if (!text.length) return contextMenu.reply(HandlerReply.createMessageContentReply(contextMenu, 'owoify'));
        await contextMenu.deferReply();
        const owo = owoify.default(text);
        const split = Util.splitMessage(owo, { maxLength: 2000 })[0]!
        return contextMenu.followUp({ content: split, allowedMentions: { parse: [] } });
    }
}
