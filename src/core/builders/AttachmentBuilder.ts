import Discord from 'discord.js';

export class AttachmentBuilder extends Discord.AttachmentBuilder {

    public override getEmbedUrl(): string {
        return `attachment://${this.name}`;
    };
}

declare module 'discord.js' {
    export interface AttachmentBuilder {
        getEmbedUrl(): string;
    }
};

Discord.AttachmentBuilder.prototype.getEmbedUrl = AttachmentBuilder.prototype.getEmbedUrl;
