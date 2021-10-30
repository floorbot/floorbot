import { BufferResolvable, MessageAttachment } from 'discord.js';
import { Stream } from 'stream';

export class HandlerAttachment extends MessageAttachment {

    constructor(attachment: BufferResolvable | Stream, name?: string, data?: any) {
        super(attachment, name, data);
    }

    public getEmbedUrl(): string {
        return `attachment://${this.name}`
    }
}
