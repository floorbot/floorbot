import { ContextMenuHandler } from '../../../../discord/handler/abstracts/ContextMenuHandler.js';
import { OwoifyMessageCommandData } from './OwoifyMessageCommandData.js';
import { HandlerReply } from '../../../../helpers/HandlerReply.js';
import { ContextMenuInteraction, Util } from 'discord.js';
import owoify from 'owoify-js';

export class OwoifyMessageHandler extends ContextMenuHandler {

    constructor() {
        super({ group: 'Fun', global: false, nsfw: false, data: OwoifyMessageCommandData });
    }

    public async execute(contextMenu: ContextMenuInteraction): Promise<any> {
        const text = contextMenu.options.getMessage('message', true).content;
        if (!text.length) return contextMenu.reply(HandlerReply.createMessageContentReply(contextMenu, 'owoify'));
        await contextMenu.deferReply();
        const owo = (<any>owoify).default(text);
        const split = Util.splitMessage(owo, { maxLength: 2000 })[0]!
        return contextMenu.followUp({ content: split, allowedMentions: { parse: [] } });
    }
}
