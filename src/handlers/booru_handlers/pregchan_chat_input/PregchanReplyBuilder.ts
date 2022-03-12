import { EmbedBuilder } from "../../../lib/discord/builders/EmbedBuilder.js";
import { MixinConstructor } from "../../../lib/ts-mixin-extended.js";
import { BooruReplyBuilder } from "../BooruReplyBuilder.js";

export class PregchanReplyBuilder extends PregchanReplyMixin(BooruReplyBuilder) { };

export function PregchanReplyMixin<T extends MixinConstructor<BooruReplyBuilder>>(Builder: T) {
    return class PregchanReplyBuilder extends Builder {

        protected override createBooruEmbedBuilder(): EmbedBuilder {
            return super.createEmbedBuilder()
                .setFooter({ text: `Powered by Pregchan`, iconURL: 'https://pregchan.com/favicons/favicon.ico' });
        }
    };
}
