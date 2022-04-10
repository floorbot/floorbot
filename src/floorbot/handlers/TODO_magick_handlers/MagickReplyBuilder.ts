import { AvatarAttachmentExpression, ResourceAttachmentBuilder } from '../../../lib/builders/ResourceMixins.js';
import { ImageMagickCLIAction, MagickProgress } from '../../../lib/tools/image-magick/ImageMagickCLIAction.js';
import { AttachmentBuilder } from '../../../lib/discord/builders/AttachmentBuilder.js';
import { SelectMenuBuilder } from '../../../lib/discord/builders/SelectMenuBuilder.js';
import { ReplyBuilder } from '../../../lib/discord/builders/ReplyBuilder.js';
import { EmbedBuilder } from '../../../lib/discord/builders/EmbedBuilder.js';
import { HandlerUtil } from '../../../lib/discord/HandlerUtil.js';
import humanizeDuration from 'humanize-duration';
import { ProbeResult } from 'probe-image-size';
import { Message } from 'discord.js';

export class MagickReplyBuilder extends ReplyBuilder {

    protected override createEmbedBuilder(): EmbedBuilder {
        const embed = super.createEmbedBuilder();
        const iconURL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/ImageMagick_logo.svg/1200px-ImageMagick_logo.svg.png';
        embed.setFooter({ text: `Powered by ImageMagick`, iconURL: iconURL });
        return embed;
    }

    public addMagickFailedEmbed(metadata: ProbeResult, action: ImageMagickCLIAction): this {
        const embed = this.createEmbedBuilder()
            .setThumbnail(metadata.url)
            .setDescription([
                `Sorry it looks like I ran into an unexpected issue with \`${action.label.toLowerCase()}\``,
                '*There are many reasons this might occur so please be patient and try again later*',
            ]);
        return this.addEmbed(embed);
    }

    public addMagickNoImageEmbed(query?: Message | string): this {
        const attachment = ResourceAttachmentBuilder.createAvatarAttachment(AvatarAttachmentExpression.FROWN);
        const embed = this.createEmbedBuilder()
            .setThumbnail(attachment.getEmbedUrl());
        if (query instanceof Message) embed.setDescription(`Sorry! I could not find a valid image in your [message](${query.url})`);
        else embed.setDescription(`Sorry I could not find an image from your query \`${query}\``);
        this.addFile(attachment);
        this.addEmbed(embed);
        return this;
    }

    public addMagickProgressEmbed(metadata: ProbeResult, action: ImageMagickCLIAction, progress: MagickProgress): this {
        const embed = this.createEmbedBuilder()
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
        this.addEmbed(embed);
        this.clearComponents();
        return this;
    }

    public addMagickImageEmbed(data: { metadata: ProbeResult, actions: { [index: string]: ImageMagickCLIAction; }, action?: ImageMagickCLIAction, buffer?: Buffer; }): this {
        const { metadata, actions, action, buffer } = data;

        const selectMenu = new SelectMenuBuilder()
            .setCustomId('action')
            .setPlaceholder('Select a process to apply to the image');
        for (const [id, action] of Object.entries(actions)) {
            selectMenu.addOptions({
                value: id,
                label: action.label,
                description: action.description
            });
        }

        const timeString = humanizeDuration(Date.now() - (<any>this.context!).createdTimestamp, { largest: 1 });
        const embed = this.createEmbedBuilder()
            .setTitle(action ? `${action.label} Original` : 'Original Image')
            .setURL(metadata.url);
        if (buffer) {
            const attachment = new AttachmentBuilder(buffer, `${action ? action.label : 'image-magick'}.${metadata.type}`);
            embed.setImage(attachment.getEmbedUrl());
            const kb = Math.round((metadata.length || Buffer.byteLength(buffer) / 1000));
            const metaString = ` ${metadata.width}x${metadata.height} ${HandlerUtil.formatCommas(kb)}KB`;
            embed.setFooter({ text: `${metadata.type.toUpperCase()}${metaString} in ${timeString}` });
            this.addEmbed(embed)
                .addFile(attachment)
                .addActionRow(selectMenu.toActionRow());
            return this;
        } else {
            embed.setImage(metadata.url);
            const metaString = ` ${metadata.width}x${metadata.height} ${HandlerUtil.formatCommas(Math.round(metadata.length / 1000))}KB`;
            embed.setFooter({ text: `${metadata.type.toUpperCase()}${metaString} in ${timeString}` });
            this.addEmbed(embed)
                .addActionRow(selectMenu.toActionRow());
            return this;
        }
    }
}
