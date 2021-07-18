import { MessageAttachment, BufferResolvable } from 'discord.js';
import { MagickAction } from '../MagickConstants';
import * as probe from 'probe-image-size';

export class MagickAttachment extends MessageAttachment {

    public readonly metadata: probe.ProbeResult;
    public readonly action: MagickAction;

    constructor(buffer: BufferResolvable, action: MagickAction, metadata: probe.ProbeResult) {
        super(buffer, `${action!.label}.${metadata.type}`);

        this.metadata = metadata;
        this.action = action;
    }
}
