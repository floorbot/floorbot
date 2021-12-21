import { ContextMenuInteraction, MessageApplicationCommandData } from "discord.js";
import { ReplyBuilder } from "../../../lib/discord/builders/ReplyBuilder.js";
import { OwoifyMessageCommandData } from "./OwoifyMessageCommandData.js";
import { ApplicationCommandHandler } from "discord.js-handlers";
import { OwoifyReplyBuilder } from "../OwoifyMixins.js";

export class OwoifyMessageHandler extends ApplicationCommandHandler<MessageApplicationCommandData> {

    constructor() {
        super(OwoifyMessageCommandData);
    }

    public async run(contextMenu: ContextMenuInteraction): Promise<void> {
        const text = contextMenu.options.getMessage('message', true).content;
        if (!text.length) return contextMenu.reply(new ReplyBuilder(contextMenu).addMissingContentEmbed('owoify'));
        const replyOptions = new OwoifyReplyBuilder(contextMenu)
            .setOwoifiedContent(text)
            .suppressMentions();
        return contextMenu.reply(replyOptions);
    }
}
