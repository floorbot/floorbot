import { ContextMenuInteraction, MessageApplicationCommandData } from 'discord.js';
import { FlipMessageCommandData } from './FlipMessageCommandData.js';
import { ApplicationCommandHandler } from 'discord.js-handlers';
import { FlipReplyBuilder } from '../FlipMixins.js';

export class FlipMessageHandler extends ApplicationCommandHandler<MessageApplicationCommandData> {

    constructor() {
        super(FlipMessageCommandData);
    }

    public async run(contextMenu: ContextMenuInteraction): Promise<void> {
        const text = contextMenu.options.getMessage('message', true).content;
        if (!text.length) return contextMenu.reply(new FlipReplyBuilder(contextMenu).addMissingContentEmbed('flip'));
        const replyOptions = new FlipReplyBuilder(contextMenu)
            .setFlippedContent(text)
            .suppressMentions();
        return await contextMenu.reply(replyOptions);
    }
}
