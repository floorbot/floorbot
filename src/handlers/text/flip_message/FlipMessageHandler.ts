import { ContextMenuCommandInteraction, MessageApplicationCommandData } from 'discord.js';
import { TextReplyBuilder } from '../text_chat_input/TextReplyBuilder.js';
import { FlipMessageCommandData } from './FlipMessageCommandData.js';
import { ApplicationCommandHandler } from 'discord.js-handlers';

export class FlipMessageHandler extends ApplicationCommandHandler<MessageApplicationCommandData> {

    constructor() {
        super(FlipMessageCommandData);
    }

    public async run(contextMenu: ContextMenuCommandInteraction): Promise<void> {
        const text = contextMenu.options.getMessage('message', true).content;
        if (!text.length) return contextMenu.reply(new TextReplyBuilder(contextMenu).addMissingContentEmbed('flip'));
        const replyOptions = new TextReplyBuilder(contextMenu)
            .setFlippedContent(text)
            .suppressMentions();
        return await contextMenu.reply(replyOptions);
    }
}
