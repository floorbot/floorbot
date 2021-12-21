import { ReplyBuilder } from "../../lib/discord/builders/ReplyBuilder.js";
import { MixinConstructor } from "../../lib/ts-mixin-extended.js";
import { HandlerUtil } from "../../lib/discord/HandlerUtil.js";
import { owoify } from 'owoifyx';

export class OwoifyReplyBuilder extends OwoifyReplyMixin(ReplyBuilder) { };

export function OwoifyReplyMixin<T extends MixinConstructor<ReplyBuilder>>(Builder: T) {
    return class OwoifyReplyBuilder extends Builder {

        public setOwoifiedContent(content: string): this {
            const owoified = owoify(content);
            const shortened = HandlerUtil.shortenMessage(owoified, { maxLength: 2000 });
            return this.setContent(shortened);
        }
    };
}
