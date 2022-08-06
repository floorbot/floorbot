import { ReplyBuilder, ResponseOptions } from './ReplyBuilder.js';
import { AttachmentBuilder } from 'discord.js';

declare module 'discord.js' {
    export interface AttachmentBuilder {
        getEmbedUrl(): string;
        toReplyOptions(replyOptions?: ReplyOptions): ReplyBuilder;
    }
};

AttachmentBuilder.prototype.getEmbedUrl = function (): string {
    return `attachment://${this.name}`;
};

AttachmentBuilder.prototype.toReplyOptions = function (replyOptions: ResponseOptions = {}): ReplyBuilder {
    return new ReplyBuilder(replyOptions).addFiles(this);
};
