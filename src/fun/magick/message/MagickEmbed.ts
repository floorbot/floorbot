import { MessageEmbed, GuildMember, InteractionReplyOptions, GuildChannel } from 'discord.js';
import { MagickAction, MagickProgress, ImageData } from '../MagickConstants'
import { HandlerContext } from 'discord.js-commands';
import { MagickAttachment } from './MagickAttachment';

export class MagickEmbed extends MessageEmbed {

    constructor(context: HandlerContext) {
        super();
        const { member } = (<{ member: GuildMember }>context);
        const displayName = member.displayName;
        this.setAuthor(displayName, member.user.displayAvatarURL());
        this.setColor(member.displayColor || 14840969);
    }

    public static getWhitelistEmbed(context: HandlerContext): MagickEmbed {
        return new MagickEmbed(context)
            .setDescription('Sorry! only the original author can make changes to this image');
    }

    public static getProgressEmbed(context: HandlerContext, image: ImageData, action: MagickAction, progress: MagickProgress): MagickEmbed {
        const embed = new MagickEmbed(context)
            .setTitle(`Please wait for \`${action.label.toLowerCase()}\``)
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

    public static getImageEmbed(context: HandlerContext, data: ImageData | MagickAttachment): MagickEmbed {
        const embed = new MagickEmbed(context)
        if (data instanceof MagickAttachment) {
            embed.setTitle(`${data.action.label} Original`);
            embed.setImage(`attachment://${data.name}`);
            embed.setURL(data.image.url);
        } else {
            embed.setTitle('Original Image');
            embed.setImage(data.url);
            embed.setURL(data.url);
        }
        return embed;
    }

    public static getInvalidInputEmbed(context: HandlerContext, input: String): MagickEmbed {
        return new MagickEmbed(context).setDescription(`Sorry! I'm not sure how to handle this:\n\`${input}\``);
    }

    public static getMissingCacheEmbed(context: HandlerContext, channel: GuildChannel): MagickEmbed {
        return new MagickEmbed(context)
            .setDescription([
                `Sorry! there are no cached images for ${channel}`,
                '*Please post an image or include one in the command*'
            ].join('\n'));
    }


    public static getFailedEmbed(context: HandlerContext, image: ImageData, action: MagickAction): MagickEmbed {
        return new MagickEmbed(context)
            .setThumbnail(image.url)
            .setDescription([
                `Sorry it looks like I ran into an unexpected issue with \`${action!.label.toLowerCase()}\``,
                '*There are many reasons this might occur so please be patient and try again later*'
            ].join('\n'))
    }

    public toReplyOptions(ephemeral: boolean = false): InteractionReplyOptions {
        return { embeds: [this], components: [], ephemeral: ephemeral };
    }
}
