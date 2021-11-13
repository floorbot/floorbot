import { HandlerAttachment } from '../../../../discord/components/HandlerAttachment.js';
import { MagickAction } from '../MagickConstants';
import { ProbeResult } from 'probe-image-size';
import { BufferResolvable } from 'discord.js';

export class MagickAttachment extends HandlerAttachment {

    public readonly metadata: ProbeResult;
    public readonly action: MagickAction;

    constructor(buffer: BufferResolvable, action: MagickAction, metadata: ProbeResult) {
        super(buffer, `${action!.label}.${metadata.type}`);
        this.metadata = metadata;
        this.action = action;
    }

    public static getMagickAttachment(buffer: BufferResolvable, action: MagickAction, metadata: ProbeResult): MagickAttachment {
        return new MagickAttachment(buffer, action, metadata);
    }
}
