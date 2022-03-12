import { EmbedBuilder } from "../../../lib/discord/builders/EmbedBuilder.js";
import { MixinConstructor } from "../../../lib/ts-mixin-extended.js";
import { BooruReplyBuilder } from "../BooruReplyBuilder.js";

export class E621ReplyBuilder extends E621ReplyMixin(BooruReplyBuilder) { };

export function E621ReplyMixin<T extends MixinConstructor<BooruReplyBuilder>>(Builder: T) {
    return class E621ReplyBuilder extends Builder {

        protected override createBooruEmbedBuilder(): EmbedBuilder {
            return super.createEmbedBuilder()
                .setFooter({ text: `Powered by E621`, iconURL: 'https://en.wikifur.com/w/images/d/dd/E621Logo.png' });
        }
    };
}
