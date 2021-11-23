import { MessageEmbed, MessageEmbedOptions, Interaction } from 'discord.js';
import { HandlerEmbed } from '../../../../discord/helpers/components/HandlerEmbed.js';
import { HandlerUtil } from '../../../../discord/HandlerUtil.js';
import { MagickAction, MagickProgress } from '../MagickConstants.js';
import { MagickAttachment } from './MagickAttachment.js';
import { ProbeResult } from 'probe-image-size';
import humanizeDuration from 'humanize-duration';

export class MagickEmbed extends HandlerEmbed {

    constructor(command: Interaction, data?: MessageEmbed | MessageEmbedOptions) {
        super(data);
        this.setContextAuthor(command);
        this.setFooter('Powered by ImageMagick', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/ImageMagick_logo.svg/1200px-ImageMagick_logo.svg.png');
    }

    public static getImageEmbed(interaction: Interaction, data: ProbeResult | MagickAttachment): HandlerEmbed {
        const timeString = humanizeDuration(Date.now() - interaction.createdTimestamp, { largest: 1 })
        const embed = new MagickEmbed(interaction)
        if (data instanceof MagickAttachment) {
            const { metadata } = data;
            embed.setTitle(`${data.action.label} Original`);
            embed.setImage(`attachment://${data.name}`);
            embed.setURL(metadata.url);
            const metaString = ` ${metadata.width}x${metadata.height} ${HandlerUtil.formatCommas(Math.round((metadata.length || Buffer.byteLength(<any>data.attachment)) / 1000))}KB`;
            embed.setFooter(`${metadata.type.toUpperCase()}${metaString} in ${timeString}`)
        } else {
            embed.setTitle('Original Image');
            embed.setImage(data.url);
            embed.setURL(data.url);
            const metaString = ` ${data.width}x${data.height} ${HandlerUtil.formatCommas(Math.round(data.length / 1000))}KB`;
            embed.setFooter(`${data.type.toUpperCase()}${metaString} in ${timeString}`)
        }
        return embed;
    }

    public static getProgressEmbed(interaction: Interaction, image: ProbeResult, action: MagickAction, progress: MagickProgress): HandlerEmbed {
        const embed = new MagickEmbed(interaction)
            .setTitle(`Please wait for \`${action.label.toLowerCase()}\``)
            .setDescription('*This may take a while especially for gifs*')
            .setThumbnail(image.url)
        if (Object.keys(progress).length) {
            embed.setDescription(Object.entries(progress).map(([key, value]) => {
                const progressBar = new Array(11).fill('▬');
                progressBar[Math.floor(value.percent / 10)] = '🟢';
                return `${progressBar.join('')} [${value.percent}%] ${key}: ${value.counter}`
            }).join('\n'));
        }
        return embed;
    }


    public static getFailedEmbed(interaction: Interaction, image: ProbeResult, action: MagickAction): HandlerEmbed {
        return new MagickEmbed(interaction)
            .setThumbnail(image.url)
            .setDescription([
                `Sorry it looks like I ran into an unexpected issue with \`${action!.label.toLowerCase()}\``,
                '*There are many reasons this might occur so please be patient and try again later*'
            ].join('\n'))
    }
}
