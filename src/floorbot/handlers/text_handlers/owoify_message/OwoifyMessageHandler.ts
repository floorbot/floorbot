import { OwoifyMessageCommandData } from "./OwoifyMessageCommandData.js";
import { MessageContextMenuCommandHandler } from "discord.js-handlers";
import { MessageContextMenuCommandInteraction } from "discord.js";
import { OwoifyReplyBuilder } from './OwoifyReplyBuilder.js';

export class OwoifyMessageHandler extends MessageContextMenuCommandHandler {

    constructor() {
        super(OwoifyMessageCommandData);
    }

    public async run(contextMenu: MessageContextMenuCommandInteraction): Promise<void> {
        const text = contextMenu.options.getMessage('message', true).content;
        if (!text.length) {
            const replyOptions = new OwoifyReplyBuilder(contextMenu)
                .addMissingContentEmbed('owoify');
            return contextMenu.reply(replyOptions);
        }
        const replyOptions = new OwoifyReplyBuilder(contextMenu)
            .setOwoifiedContent(text)
            .suppressMentions();
        return contextMenu.reply(replyOptions);
    }
}
