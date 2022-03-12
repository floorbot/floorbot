import { EmbedBuilder } from "../../../lib/discord/builders/EmbedBuilder.js";
import { BooruReplyBuilder, BooruReplyMixin } from "../BooruReplyBuilder.js";
import { MixinConstructor } from "../../../lib/ts-mixin-extended.js";

export class Rule34ReplyBuilder extends BooruReplyMixin(BooruReplyBuilder) { };

export function Rule34ReplyMixin<T extends MixinConstructor<BooruReplyBuilder>>(Builder: T) {
    return class Rule34ReplyBuilder extends Builder {

        protected override createBooruEmbedBuilder(): EmbedBuilder {
            return super.createEmbedBuilder()
                .setFooter({ text: `Powered by Rule34`, iconURL: 'https://rule34.xxx/apple-touch-icon-precomposed.png' });
        }
    };
}
