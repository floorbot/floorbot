import { ContextMenuInteraction, MessageApplicationCommandData, Util } from 'discord.js';
import { ReplyBuilder } from '../../../lib/discord/builders/ReplyBuilder.js';
import { FlipMessageCommandData } from './FlipMessageCommandData.js';
import { FlipHandler } from '../FlipHandler.js';

export class FlipMessageHandler extends FlipHandler<MessageApplicationCommandData> {

    constructor() {
        super(FlipMessageCommandData);
    }

    public async run(contextMenu: ContextMenuInteraction): Promise<void> {
        const text = contextMenu.options.getMessage('message', true).content;
        if (!text.length) return contextMenu.reply(new ReplyBuilder(contextMenu).addMissingContentReply('flip'));
        await contextMenu.deferReply();
        const flipped = this.flipText(text);
        const split = Util.splitMessage(flipped, { maxLength: 2000 })[0]!;
        contextMenu.followUp({ content: split, allowedMentions: { parse: [] } });
    }
}
