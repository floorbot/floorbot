import { ChatInputApplicationCommandData, ChatInputCommandInteraction } from "discord.js";
import { CoinFlipChatInputCommandData } from "./CoinFlipChatInputCommandData.js";
import { CoinFlipReplyBuilder } from './CoinFlipReplyBuilder.js';
import { ApplicationCommandHandler } from "discord.js-handlers";

export class CoinFlipChatInputHandler extends ApplicationCommandHandler<ChatInputApplicationCommandData> {

    private static readonly MAX_COINS = 100000;

    constructor() {
        super(CoinFlipChatInputCommandData);
    }

    public async run(command: ChatInputCommandInteraction): Promise<void> {
        const count = command.options.getInteger('count', false) ?? 1;
        await command.deferReply();
        let heads = 0;
        if (count <= CoinFlipChatInputHandler.MAX_COINS) {
            for (let i = 0; i < count; i++) {
                if (Math.round(Math.random())) heads++;
            }
        } else {
            const boxMullers = [];
            const n = Math.min(Math.ceil(count / CoinFlipChatInputHandler.MAX_COINS), CoinFlipChatInputHandler.MAX_COINS);
            for (let i = 0; i < n; i++) { boxMullers.push(CoinFlipChatInputHandler.randomBoxMuller()); }
            heads = Math.round((boxMullers.reduce((a, b) => a + b, 0) / boxMullers.length) * count);
        }
        const replyOptions = new CoinFlipReplyBuilder(command)
            .addCoinFlipEmbed(heads, count);
        await command.followUp(replyOptions);
    }

    // https://stackoverflow.com/a/49434653
    private static randomBoxMuller(min: number = 0, max: number = 1, skew: number = 1): number {
        let u = 0, v = 0;
        while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
        while (v === 0) v = Math.random();
        let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

        num = num / 10.0 + 0.5; // Translate to 0 -> 1
        if (num > 1 || num < 0) {
            num = CoinFlipChatInputHandler.randomBoxMuller(min, max, skew); // resample between 0 and 1 if out of range
        } else {
            num = Math.pow(num, skew); // Skew
            num *= max - min; // Stretch to fill range
            num += min; // offset to min
        }
        return num;
    }
}
