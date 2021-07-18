import { MessageAttachment, BufferResolvable } from 'discord.js';
import { MagickAction, ImageData } from '../MagickConstants';

export class MagickAttachment extends MessageAttachment {

    public readonly action: MagickAction;
    public readonly image: ImageData;

    constructor(buffer: BufferResolvable, action: MagickAction, image: ImageData) {
        super(buffer, `${action!.label}.${image.type}`);

        this.action = action;
        this.image = image;
    }
}
