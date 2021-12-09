import { ContextMenuInteraction, Interaction, InteractionReplyOptions, Message, MessageComponentInteraction, SelectMenuInteraction } from 'discord.js';
import { ImageMagickCLIAction, MagickProgress } from '../../../../clis/image-magick/ImageMagickCLIAction.js';
import { ContextMenuHandler } from '../../../../discord/handlers/abstracts/ContextMenuHandler.js';
import { MagickMessageCommandData } from './MagickMessageCommandData.js';
import { HandlerUtil } from '../../../../discord/HandlerUtil.js';
import probe, { ProbeResult } from 'probe-image-size';
import { MagickReplies } from '../MagickReplies.js';
import { MagickUtil } from '../MagickUtil.js';

export class MagickMessageHandler extends ContextMenuHandler {

    private readonly actions: { [index: string]: ImageMagickCLIAction };
    private readonly replies: MagickReplies;

    constructor(path?: string) {
        super({ group: 'Fun', global: false, nsfw: false, data: MagickMessageCommandData });

        this.actions = MagickUtil.makeActions(path)
        this.replies = new MagickReplies();
    }

    public async execute(contextMenu: ContextMenuInteraction<'cached'>): Promise<any> {
        await contextMenu.deferReply();
        const targetMessage = contextMenu.options.getMessage('message', true);
        const metadata = await this.probeMessage(targetMessage);
        if (!metadata) {
            const replyOptions = this.replies.createNoImageReply(contextMenu, targetMessage);
            return contextMenu.followUp(replyOptions);
        }

        const response = await this.fetchMagickResponse(contextMenu, metadata);
        const message = await contextMenu.followUp(response);

        const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 10 });
        collector.on('collect', async (component: MessageComponentInteraction<'cached'>) => {
            if (component.isSelectMenu()) {
                if (!HandlerUtil.isAdminOrOwner(component.member, contextMenu)) return component.reply(this.replies.createAdminOrOwnerReply(component));
                await component.deferUpdate();
                const action = this.actions[component.values[0]!]!;
                const metadata = (await probe(message.embeds[0]!.image!.url!).catch(() => null))!;
                const replyOptions = this.replies.createProgressReply(component, metadata, action, {});
                await message.edit(replyOptions);
                await message.removeAttachments();
                const response = await this.fetchMagickResponse(component, metadata, action, message);
                await message.edit(response);
            }
        });
        collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
    }

    private async probeMessage(message: Message): Promise<ProbeResult | null> {

        let metadata: ProbeResult | null = null;

        // Check all embeds for valid images
        for (const embed of message.embeds) {
            if (embed.thumbnail && embed.thumbnail.url) metadata = await probe(embed.thumbnail.url).catch(() => null) || metadata;
            if (embed.image && embed.image.url) metadata = await probe(embed.image.url).catch(() => null) || metadata;
        }

        // Check all attachments for valid images
        for (const attachment of message.attachments.values()) {
            metadata = await probe(attachment.url).catch(() => null) || metadata;
        }

        return metadata || null;
    }

    private async fetchMagickResponse(interaction: Interaction, metadata: ProbeResult, action?: ImageMagickCLIAction, message?: Message): Promise<InteractionReplyOptions> {

        // Need to convert SVG files since they dont embed
        if (metadata.type === 'svg') {
            metadata.type = 'png';
            if (!action) action = this.actions['HUGEMOJI'];
        }

        // Command first used and not SVG
        if (!action) return this.replies.createImageReply(interaction, { metadata: metadata, actions: this.actions });

        let updateTime = 0; // First update will always post
        return action.run(metadata, (progress: MagickProgress) => {
            const now = Date.now();
            if ((updateTime + 1000) <= now) {
                updateTime = now;
                if (!(interaction instanceof SelectMenuInteraction)) return;
                const replyOptions = this.replies.createProgressReply(interaction, metadata, action!, progress);
                if (message) message.edit(replyOptions).catch(HandlerUtil.handleErrors(this))
            }
        }).then((buffer: Buffer) => {
            const newMetadata = probe.sync(buffer)!;
            const replyOptions = this.replies.createImageReply(interaction, { metadata: newMetadata, action: action, actions: this.actions, buffer: buffer });
            return replyOptions;
        }).catch((_reason) => {
            return this.replies.createFailedEmbed(interaction, metadata, action!);
        });
    }
}
