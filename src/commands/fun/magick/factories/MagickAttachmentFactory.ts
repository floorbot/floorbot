import { HandlerAttachment } from 'discord.js-commands';
import { ProbeResult } from 'probe-image-size';
import { BufferResolvable } from 'discord.js';
import { MagickAction } from '../../../..';

export class MagickAttachmentFactory {

    public static getMagickAttachment(buffer: BufferResolvable, action: MagickAction, metadata: ProbeResult): MagickAttachment {
        return new MagickAttachment(buffer, action, metadata);
    }
}

export class MagickAttachment extends HandlerAttachment {

    public readonly metadata: ProbeResult;
    public readonly action: MagickAction;

    constructor(buffer: BufferResolvable, action: MagickAction, metadata: ProbeResult) {
        super(buffer, `${action!.label}.${metadata.type}`);
        this.metadata = metadata;
        this.action = action;
    }
}
