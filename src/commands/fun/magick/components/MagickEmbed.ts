import { Util, MessageEmbed, MessageEmbedOptions } from 'discord.js';
import { MagickAction, MagickProgress } from '../MagickConstants';
import { HandlerEmbed } from '../../../../components/HandlerEmbed';
import { HandlerContext } from '../../../../discord/Util';
import { MagickAttachment } from './MagickAttachment';
import { ProbeResult } from 'probe-image-size';

// @ts-ignore
import * as DHMS from 'dhms.js';

export class MagickEmbed extends HandlerEmbed {

    constructor(context: HandlerContext, data?: MessageEmbed | MessageEmbedOptions) {
        super(data);
        this.setContextAuthor(context);
        this.setFooter('Powered by ImageMagick', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/ImageMagick_logo.svg/1200px-ImageMagick_logo.svg.png');
    }

    public static getImageEmbed(context: HandlerContext, data: ProbeResult | MagickAttachment): HandlerEmbed {
        const timeString = DHMS.print(Date.now() - context.createdTimestamp, { limit: 1, fullname: true });
        const embed = new MagickEmbed(context)
        if (data instanceof MagickAttachment) {
            const { metadata } = data;
            embed.setTitle(`${data.action.label} Original`);
            embed.setImage(`attachment://${data.name}`);
            embed.setURL(metadata.url);
            const metaString = ` ${metadata.width}x${metadata.height} ${Util.formatCommas(Math.round((metadata.length || Buffer.byteLength(<any>data.attachment)) / 1000))}KB`;
            embed.setFooter(`${metadata.type.toUpperCase()}${metaString} in ${timeString}`)
        } else {
            embed.setTitle('Original Image');
            embed.setImage(data.url);
            embed.setURL(data.url);
            const metaString = ` ${data.width}x${data.height} ${Util.formatCommas(Math.round(data.length / 1000))}KB`;
            embed.setFooter(`${data.type.toUpperCase()}${metaString} in ${timeString}`)
        }
        return embed;
    }

    public static getProgressEmbed(context: HandlerContext, image: ProbeResult, action: MagickAction, progress: MagickProgress): HandlerEmbed {
        const embed = new MagickEmbed(context)
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

    // public static getMissingCacheEmbed(context: HandlerContext, channel: GuildChannel): HandlerEmbed {
    //     return new MagickEmbed(context)
    //         .setDescription([
    //             `Sorry! there are no cached images for ${channel}`,
    //             '*Please post an image or include one in the command*'
    //         ].join('\n'));
    // }

    public static getFailedEmbed(context: HandlerContext, image: ProbeResult, action: MagickAction): HandlerEmbed {
        return new MagickEmbed(context)
            .setThumbnail(image.url)
            .setDescription([
                `Sorry it looks like I ran into an unexpected issue with \`${action!.label.toLowerCase()}\``,
                '*There are many reasons this might occur so please be patient and try again later*'
            ].join('\n'))
    }
}
