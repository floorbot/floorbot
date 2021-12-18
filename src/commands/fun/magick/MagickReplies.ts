import { ImageMagickCLIAction, MagickProgress } from '../../../lib/tools/image-magick/ImageMagickCLIAction.js';
import { HandlerEmbed } from '../../../lib/discord/helpers/components/HandlerEmbed.js';
import { HandlerReplies } from '../../../lib/discord/helpers/HandlerReplies.js';
import { Interaction, InteractionReplyOptions, Message } from 'discord.js';
import { HandlerUtil } from '../../../lib/discord/HandlerUtil.js';
import humanizeDuration from 'humanize-duration';
import { ProbeResult } from 'probe-image-size';

export class MagickReplies extends HandlerReplies {

    public override createEmbedTemplate(context?: Interaction | Message): HandlerEmbed {
        return super.createEmbedTemplate(context)
            .setFooter('Powered by ImageMagick', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/ImageMagick_logo.svg/1200px-ImageMagick_logo.svg.png');
    }

    public createFailedEmbed(context: Interaction | Message, metadata: ProbeResult, action: ImageMagickCLIAction): InteractionReplyOptions {
        const embed = this.createEmbedTemplate(context)
            .setThumbnail(metadata.url)
            .setDescription([
                `Sorry it looks like I ran into an unexpected issue with \`${action.label.toLowerCase()}\``,
                '*There are many reasons this might occur so please be patient and try again later*',
            ]);
        return { embeds: [embed], components: [] };
    }

    public createNoImageReply(context: Interaction | Message, query?: Message | string): InteractionReplyOptions {
        const attachment = this.getAvatar('1-3');
        const embed = this.createEmbedTemplate(context)
            .setThumbnail(attachment.getEmbedUrl());
        if (query instanceof Message) embed.setDescription(`Sorry! I could not find a valid image in your [message](${query.url})`);
        else embed.setDescription(`Sorry I could not find an image from your query \`${query}\``);
        return { embeds: [embed], files: [attachment] };
    }

    public createProgressReply(context: Interaction | Message, metadata: ProbeResult, action: ImageMagickCLIAction, progress: MagickProgress): InteractionReplyOptions {
        const embed = this.createEmbedTemplate(context)
            .setTitle(`Please wait for \`${action.label.toLowerCase()}\``)
            .setDescription('*This may take a while especially for gifs*')
            .setThumbnail(metadata.url);
        if (Object.keys(progress).length) {
            embed.setDescription(Object.entries(progress).map(([key, value]) => {
                const progressBar = new Array(11).fill('▬');
                progressBar[Math.floor(value.percent / 10)] = '🟢';
                return `${progressBar.join('')} [${value.percent}%] ${key}: ${value.counter}`;
            }).join('\n'));
        }
        return { embeds: [embed], components: [] };
    }

    public createImageReply(interaction: Interaction, data: { metadata: ProbeResult, actions: { [index: string]: ImageMagickCLIAction; }, action?: ImageMagickCLIAction, buffer?: Buffer; }): InteractionReplyOptions {
        const { metadata, actions, action, buffer } = data;

        const selectMenu = this.createSelectMenuTemplate()
            .setCustomId('action')
            .setPlaceholder('Select a process to apply to the image');
        for (const [id, action] of Object.entries(actions)) {
            selectMenu.addOptions({
                value: id,
                label: action.label,
                description: action.description
            });
        }

        const timeString = humanizeDuration(Date.now() - interaction.createdTimestamp, { largest: 1 });
        const embed = this.createEmbedTemplate(interaction)
            .setTitle(action ? `${action.label} Original` : 'Original Image')
            .setURL(metadata.url);
        if (buffer) {
            const attachment = this.createAttachmentTemplate(buffer, `${action ? action.label : 'image-magick'}.${metadata.type}`);
            embed.setImage(attachment.getEmbedUrl());
            const kb = Math.round((metadata.length || Buffer.byteLength(buffer) / 1000));
            const metaString = ` ${metadata.width}x${metadata.height} ${HandlerUtil.formatCommas(kb)}KB`;
            embed.setFooter(`${metadata.type.toUpperCase()}${metaString} in ${timeString}`);
            return { embeds: [embed], components: [selectMenu.toActionRow()], files: [attachment] };
        } else {
            embed.setImage(metadata.url);
            const metaString = ` ${metadata.width}x${metadata.height} ${HandlerUtil.formatCommas(Math.round(metadata.length / 1000))}KB`;
            embed.setFooter(`${metadata.type.toUpperCase()}${metaString} in ${timeString}`);
            return { embeds: [embed], components: [selectMenu.toActionRow()] };
        }
    }
}
