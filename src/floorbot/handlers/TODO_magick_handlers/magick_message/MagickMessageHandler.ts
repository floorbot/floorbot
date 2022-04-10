import { MessageApplicationCommandData, MessageContextMenuCommandInteraction } from 'discord.js';
import { MagickMessageCommandData } from './MagickMessageCommandData.js';
import probe, { ProbeResult } from 'probe-image-size';
import { MagickHandler } from '../MagickHandler.js';

export class MagickMessageHandler extends MagickHandler<MessageContextMenuCommandInteraction, MessageApplicationCommandData> {

    constructor(path?: string) {
        super(MagickMessageCommandData, path);
    }

    public async probeCommand(contextMenu: MessageContextMenuCommandInteraction): Promise<ProbeResult | null> {
        const message = contextMenu.targetMessage;

        // Check all attachments for valid images (in reverse order)
        for (const attachment of [...message.attachments.values()].reverse()) {
            const metadata = await probe(attachment.url).catch(() => null);
            if (metadata) return metadata;
        }

        // Check all embeds for valid images (in reverse order)
        for (const embed of message.embeds.reverse()) {
            if (embed.image && embed.image.url) {
                const metadata = await probe(embed.image.url).catch(() => null);
                if (metadata) return metadata;
            }
            if (embed.thumbnail && embed.thumbnail.url) {
                const metadata = await probe(embed.thumbnail.url).catch(() => null);
                if (metadata) return metadata;
            }
        }

        return null;
    }
}
