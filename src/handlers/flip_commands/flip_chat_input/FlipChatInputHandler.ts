import { ChatInputApplicationCommandData, CommandInteraction } from "discord.js";
import { FlipChatInputCommandData } from "./FlipChatInputCommandData.js";
import { ApplicationCommandHandler } from "discord.js-handlers";
import { FlipReplyBuilder } from "../FlipMixins.js";

export class FlipChatInputHandler extends ApplicationCommandHandler<ChatInputApplicationCommandData> {

    private static readonly MAX_COINS = 100000;

    constructor() {
        super(FlipChatInputCommandData);
    }

    public async run(command: CommandInteraction): Promise<void> {
        const value = command.options.getString('value') || '1';
        let count = parseInt(value) || 0;
        if (count) {
            await command.deferReply();
            let heads = 0;
            if (count <= FlipChatInputHandler.MAX_COINS) {
                for (let i = 0; i < count; i++) { if (Math.round(Math.random())) heads++; }
            } else {
                const boxMullers = [];
                const n = Math.min(Math.ceil(count / FlipChatInputHandler.MAX_COINS), FlipChatInputHandler.MAX_COINS);
                for (let i = 0; i < n; i++) { boxMullers.push(FlipChatInputHandler.randomBoxMuller()); }
                heads = Math.round((boxMullers.reduce((a, b) => a + b, 0) / boxMullers.length) * count);
            }
            const replyOptions = new FlipReplyBuilder(command)
                .addCoinFlipEmbed(heads, count);
            command.followUp(replyOptions);
        } else {
            const replyOptions = new FlipReplyBuilder(command)
                .setFlippedContent(value)
                .suppressMentions();
            await command.reply(replyOptions);
        }
    }

    // https://stackoverflow.com/a/49434653
    private static randomBoxMuller(min: number = 0, max: number = 1, skew: number = 1): number {
        let u = 0, v = 0;
        while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
        while (v === 0) v = Math.random();
        let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

        num = num / 10.0 + 0.5; // Translate to 0 -> 1
        if (num > 1 || num < 0) {
            num = FlipChatInputHandler.randomBoxMuller(min, max, skew); // resample between 0 and 1 if out of range
        } else {
            num = Math.pow(num, skew); // Skew
            num *= max - min; // Stretch to fill range
            num += min; // offset to min
        }
        return num;
    }
}
