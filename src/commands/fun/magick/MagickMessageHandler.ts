import { ContextMenuInteraction, InteractionReplyOptions, Message, SelectMenuInteraction } from 'discord.js';
import { MagickMessageCommandData } from './MagickMessageCommandData';
import { MagickAction, MagickProgress } from './MagickConstants';
import { MagickAttachment } from './components/MagickAttachment';
import { MagickSelectMenu } from './components/MagickSelectMenu';
import { MagickEmbed } from './components/MagickEmbed';
import { HandlerContext } from '../../../discord/Util';
import { ImageMagick } from './tools/ImageMagick';
import { BaseHandler } from '../../BaseHandler';
import { ProbeResult } from 'probe-image-size';
import * as probe from 'probe-image-size';

export class MagickMessageHandler extends BaseHandler {

    constructor() {
        super({
            id: 'magick_message',
            group: 'Fun',
            global: false,
            nsfw: false,
            data: MagickMessageCommandData
        })
    }

    public async execute(interaction: ContextMenuInteraction): Promise<any> {
        await interaction.deferReply();
        const targetMessage = interaction.options.getMessage('message', true) as Message;
        let metadata: ProbeResult | null = null;
        for (const embed of targetMessage.embeds) {
            if (embed.image && embed.image.url) metadata = await probe(embed.image.url).catch(() => null) || metadata;
            if (embed.thumbnail && embed.thumbnail.url) metadata = await probe(embed.thumbnail.url).catch(() => null) || metadata;
        }
        for (const attachment of targetMessage.attachments.values()) {
            metadata = await probe(attachment.url).catch(() => null) || metadata;
        }
        if (!metadata) {
            const embed = this.getEmbedTemplate(interaction)
                .setDescription(`Sorry! I could not find a valid image in that message`);
            return interaction.followUp(embed.toReplyOptions(true));
        }
        const response = await this.fetchMagickResponse(interaction, metadata);
        let message = await interaction.followUp(response) as Message;
        const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 10 });
        collector.on('collect', async (component) => {
            if (component.isSelectMenu()) {
                if (interaction.user !== component.user) return component.reply({ content: 'Sorry! Only the original command user can use this select menu', ephemeral: true })
                await component.deferUpdate();
                const action = MagickAction[component.values[0]!]!;

                const metadata = (await probe(message.embeds[0]!.image!.url!).catch(() => null))!;
                const embed = MagickEmbed.getProgressEmbed(component, metadata, action, {});
                await message.edit({ embeds: [embed], components: [], files: [] });
                await message.removeAttachments();
                const response = await this.fetchMagickResponse(component, metadata, action);
                message = await message.edit(response);
            }
        });
        collector.on('end', this.createEnderFunction(message))
    }

    private async fetchMagickResponse(context: HandlerContext, metadata: probe.ProbeResult, action?: MagickAction): Promise<InteractionReplyOptions> {

        // Need to convert SVG files since they dont embed
        if (metadata.type === 'svg') {
            metadata.type = 'png';
            if (!action) action = MagickAction['HUGEMOJI'];
        }

        // Command first used and not SVG
        if (!action) {
            const embed = MagickEmbed.getImageEmbed(context, metadata);
            const actionRow = MagickSelectMenu.getMagickSelectMenu(action).toActionRow();
            return { embeds: [embed], components: [actionRow] };
        }

        let updateTime = 0;
        const progress: MagickProgress = {};
        return ImageMagick.execute(
            action.getArgs(metadata),
            (reject, string) => {
                string = string.toLowerCase();
                const part = string.split(' ')[0];
                switch (part) {
                    case 'classify':
                    case 'threshold':
                    case 'mogrify':
                    case 'dither':
                    case 'reduce':
                    case 'resize':
                    case 'encode':
                    case 'save':
                        if (!(context instanceof SelectMenuInteraction)) break;
                        if (!progress[part]) progress[part] = { percent: 0, counter: 0 }
                        const percent = Number(string.match(/(\d+)(?:%)/)![1]);
                        if (percent === 100) progress[part]!.counter = progress[part]!.counter + 1;
                        progress[part]!.percent = percent;
                        const now = Date.now();
                        if ((updateTime + 1000) <= now) {
                            updateTime = now;
                            const message = context.message as Message;
                            const embed = MagickEmbed.getProgressEmbed(context, metadata, action!, progress);
                            message.edit({ embeds: [embed], components: [] })
                        }
                        break;
                    default:
                        if (/^(?:\r\n|\r|\n)$/.test(string) || string.startsWith('mogrify')) break;
                        context.client.emit('log', `[magick] Failed for an unknown reason: <${string}>`);
                        return reject(string);
                }
            }
        ).then((buffer: any) => {
            const newMetadata = probe.sync(buffer)!;
            const actionRow = MagickSelectMenu.getMagickSelectMenu(action).toActionRow();
            const attachment = MagickAttachment.getMagickAttachment(buffer, action!, newMetadata);
            const embed = MagickEmbed.getImageEmbed(context, attachment);
            return { embeds: [embed], components: [actionRow], files: [attachment] };
        }).catch((_reason) => {
            const embed = MagickEmbed.getFailedEmbed(context, metadata, action!)
            return { embeds: [embed], components: [] };
        });
    }
}
