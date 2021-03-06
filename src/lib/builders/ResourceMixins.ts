import { AttachmentBuilder } from "../discord/builders/AttachmentBuilder.js";
import { MixinConstructor } from "../ts-mixin-extended.js";
import path from 'path';
import fs from 'fs';

export class ResourceAttachmentBuilder extends ResourceAttachmentMixin(AttachmentBuilder) { };

export enum AvatarAttachmentExpression {
    SMILE_OPEN = 1,
    SMILE_CLOSED = 2,
    FROWN = 3,
    CHEEKY = 4,
    MAD = 5,
    SAD = 6,
    SAD_TEARS = 7,
    SAD_TEARS_BLUE = 8
}

export function ResourceAttachmentMixin<T extends MixinConstructor<AttachmentBuilder>>(Builder: T) {
    return class ResourceAttachmentBuilder extends Builder {

        public static createAvatarAttachment(expression: AvatarAttachmentExpression): ResourceAttachmentBuilder {
            const buffer = fs.readFileSync(`${path.resolve()}/res/avatars/2-${expression}.png`);
            return new ResourceAttachmentBuilder(buffer, 'avatar.png');
        }
    };
}
