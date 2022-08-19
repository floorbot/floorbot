import { ReplyBuilder, ResponseOptions } from './ReplyBuilder.js';
import * as Discord from 'discord.js';

export class AttachmentBuilder extends Discord.AttachmentBuilder {

    public getEmbedUrl(): string {
        return `attachment://${this.name}`;
    };

    public toReplyOptions(replyOptions: ResponseOptions = {}): ReplyBuilder {
        return new ReplyBuilder(replyOptions).addFiles(this);
    };
}
