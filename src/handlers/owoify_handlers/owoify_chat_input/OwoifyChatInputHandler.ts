import { ChatInputApplicationCommandData, CommandInteraction } from "discord.js";
import { OwoifyChatInputCommandData } from "./OwoifyChatInputCommandData.js";
import { ApplicationCommandHandler } from "discord.js-handlers";
import { OwoifyReplyBuilder } from "../OwoifyReplyBuilder.js";

export class OwoifyChatInputHandler extends ApplicationCommandHandler<ChatInputApplicationCommandData> {

    constructor() {
        super(OwoifyChatInputCommandData);
    }

    public async run(command: CommandInteraction): Promise<void> {
        const text = command.options.getString('text', true);
        const replyOptions = new OwoifyReplyBuilder(command)
            .setOwoifiedContent(text)
            .suppressMentions();
        return command.reply(replyOptions);
    }
}
