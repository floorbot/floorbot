import { ChatInputApplicationCommandData, CommandInteraction, Util } from "discord.js";
import { EmbedBuilder } from "../../../lib/discord/builders/EmbedBuilder.js";
import { FlipChatInputCommandData } from "./FlipChatInputCommandData.js";
import { HandlerUtil } from "../../../lib/discord/HandlerUtil.js";
import { FlipHandler } from "../FlipHandler.js";

export class FlipChatInputHandler extends FlipHandler<ChatInputApplicationCommandData> {

    constructor() {
        super(FlipChatInputCommandData);
    }

    public async run(command: CommandInteraction): Promise<void> {
        await command.deferReply();
        const value = command.options.getString('value') || '1';
        let count = Math.min(parseInt(value) || 0, FlipChatInputHandler.MAX_COINS);
        if (count) {
            let heads = 0;
            for (let i = 0; i < count; i++) { if (Math.round(Math.random())) heads++; }
            const embed = new EmbedBuilder()
                .setContextAuthor(command)
                .setTitle(`You flipped ${HandlerUtil.formatCommas(count)} coin${count > 1 ? 's' : ''}`)
                .addField('Heads', HandlerUtil.formatCommas(heads), true)
                .addField('Tails', HandlerUtil.formatCommas(count - heads), true);
            command.followUp(embed.toReplyOptions());
        } else {
            const flipped = this.flipText(value);
            const split = Util.splitMessage(flipped, { maxLength: 2000 })[0]!;
            command.followUp({ content: split, allowedMentions: { parse: [] } });
        }
    }

    public static readonly MAX_COINS = 100000;
}
