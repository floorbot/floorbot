import { MessageContextMenuCommandHandler } from 'discord.js-handlers';
import { FlipMessageCommandData } from './FlipMessageCommandData.js';
import { ContextMenuCommandInteraction } from 'discord.js';
import { FlipReplyBuilder } from './FlipReplyBuilder.js';

export class FlipMessageHandler extends MessageContextMenuCommandHandler {

    constructor() {
        super(FlipMessageCommandData);
    }

    public async run(contextMenu: ContextMenuCommandInteraction): Promise<void> {
        const text = contextMenu.options.getMessage('message', true).content;
        if (!text.length) {
            const replyOptions = new FlipReplyBuilder(contextMenu)
                .addMissingContentEmbed('flip');
            return contextMenu.reply(replyOptions);
        }
        const replyOptions = new FlipReplyBuilder(contextMenu)
            .setFlippedContent(text)
            .suppressMentions();
        return await contextMenu.reply(replyOptions);
    }
}
