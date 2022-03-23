import { ReplyBuilder } from "../../../lib/discord/builders/ReplyBuilder.js";
import { MixinConstructor } from "../../../lib/ts-mixin-extended.js";
import { DiscordUtil } from '../../../lib/discord/DiscordUtil.js';

export class CoinFlipReplyBuilder extends CoinFlipReplyMixin(ReplyBuilder) { };

export function CoinFlipReplyMixin<T extends MixinConstructor<ReplyBuilder>>(Builder: T) {
    return class CoinFlipReplyBuilder extends Builder {

        public addCoinFlipEmbed(heads: number, flips: number): this {
            const embed = this.createEmbedBuilder()
                .setTitle(`You flipped ${DiscordUtil.formatCommas(flips)} coin${flips > 1 ? 's' : ''}`)
                .addFields(
                    { name: 'Heads', value: DiscordUtil.formatCommas(heads), inline: true },
                    { name: 'Tails', value: DiscordUtil.formatCommas(flips - heads), inline: true }
                );
            return this.addEmbed(embed);
        }
    };
}
