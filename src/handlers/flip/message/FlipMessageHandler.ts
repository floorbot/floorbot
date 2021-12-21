import { ContextMenuInteraction, MessageApplicationCommandData } from 'discord.js';
import { ReplyBuilder } from '../../../lib/discord/builders/ReplyBuilder.js';
import { FlipMessageCommandData } from './FlipMessageCommandData.js';
import { HandlerUtil } from '../../../lib/discord/HandlerUtil.js';
import { FlipHandler } from '../FlipHandler.js';

export class FlipMessageHandler extends FlipHandler<MessageApplicationCommandData> {

    constructor() {
        super(FlipMessageCommandData);
    }

    public async run(contextMenu: ContextMenuInteraction): Promise<void> {
        const text = contextMenu.options.getMessage('message', true).content;
        if (!text.length) return contextMenu.reply(new ReplyBuilder(contextMenu).addMissingContentEmbed('flip'));
        await contextMenu.deferReply();
        const flipped = this.flipText(text);
        const shortened = HandlerUtil.shortenMessage(flipped, { maxLength: 2000 });
        await contextMenu.followUp(new ReplyBuilder(contextMenu).setContent(shortened).suppressMentions());
    }
}
