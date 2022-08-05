
import { AttachmentBuilder } from '../lib/builders/AttachmentBuilder.js';
import { MixinConstructor } from '../lib/types/ts-mixin-extended.js';
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
            console.log('ResourceMixins are a WIP');
            const buffer = fs.readFileSync(`${path.resolve()}/res/avatars/2-${expression}.png`);
            return new ResourceAttachmentBuilder(buffer, 'avatar.png');
        }
    };
}
