import { MessageAttachment, BufferResolvable } from 'discord.js';
import { MagickAction } from '../MagickConstants';
import { ProbeResult } from 'probe-image-size';

export class MagickAttachmentFactory extends MessageAttachment {

    public readonly metadata: ProbeResult;
    public readonly action: MagickAction;

    constructor(buffer: BufferResolvable, action: MagickAction, metadata: ProbeResult) {
        super(buffer, `${action!.label}.${metadata.type}`);

        this.metadata = metadata;
        this.action = action;
    }
}
