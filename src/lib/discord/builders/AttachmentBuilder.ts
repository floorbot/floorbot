import { ResponseOptions, ReplyBuilder } from './ReplyBuilder.js';
import { MessageAttachment } from 'discord.js';

export class AttachmentBuilder extends MessageAttachment {

    public getEmbedUrl(): string {
        return `attachment://${this.name}`;
    }

    public toReplyOptions(replyOptions: ResponseOptions = {}): ReplyBuilder {
        return new ReplyBuilder(replyOptions).addFile(this);
    }
}
