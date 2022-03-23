import { MessageApplicationCommandData, MessageContextMenuCommandInteraction } from "discord.js";
import { OwoifyMessageCommandData } from "./OwoifyMessageCommandData.js";
import { ApplicationCommandHandler } from "discord.js-handlers";
import { OwoifyReplyBuilder } from './OwoifyReplyBuilder.js';

export class OwoifyMessageHandler extends ApplicationCommandHandler<MessageApplicationCommandData> {

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
