import { Guild, Util, Channel, VoiceChannel, Message, InteractionReplyOptions } from 'discord.js';
import { HandlerContext, HandlerEmbed } from 'discord.js-commands';
import { CommonResponseFactory, UtilsHandler } from '../../..'

// @ts-ignore
import * as DHMS from 'dhms.js';

export class UtilsResponseFactory extends CommonResponseFactory<UtilsHandler> {

    constructor(handler: UtilsHandler) {
        super(handler);
    }

    public getInviteResponse(context: HandlerContext): InteractionReplyOptions {
        const clientUser = context.client.user!;
        return new HandlerEmbed(context)
            .setURL(`https://discord.com/api/oauth2/authorize?client_id=${clientUser.id}&permissions=0&scope=applications.commands%20bot`)
            .setThumbnail(clientUser.displayAvatarURL())
            .setDescription(`Make sure you have permissions to invite!`)
            .setTitle(`Invite ${clientUser.tag}`)
            .toReplyOptions();
    }

    public getPingingResponse(context: HandlerContext): InteractionReplyOptions {
        return new HandlerEmbed(context)
            .setDescription('Pinging...')
            .toReplyOptions();
    }

    public getPingResponse(context: HandlerContext, message: Message): InteractionReplyOptions {
        const clientUser = context.client.user!;
        return new HandlerEmbed(context)
            .setURL(`https://discord.com/api/oauth2/authorize?client_id=${clientUser.id}&permissions=0&scope=applications.commands%20bot`)
            .setThumbnail(clientUser.displayAvatarURL())
            .setTitle(clientUser.tag)
            .setDescription(
                `Ping: **${DHMS.print(message.createdTimestamp - context.createdTimestamp)}**\n` +
                (context.client.ws.ping ? `Heartbeat: **${DHMS.print(Math.round(context.client.ws.ping))}**\n` : '') +
                `Uptime: **${DHMS.print(context.client.uptime)}**`
            ).toReplyOptions();
    }

    public getNoVoiceChannelResponse(context: HandlerContext): InteractionReplyOptions {
        return new HandlerEmbed(context)
            .setDescription('Sorry! Please provide or join a voice channel 😦')
            .toReplyOptions();
    }

    public getInvalidChannelResponse(context: HandlerContext, channel: Channel): InteractionReplyOptions {
        return new HandlerEmbed(context)
            .setDescription(`Sorry! ${channel} is not a voice channel... 😶`)
            .toReplyOptions();
    }

    public getScreenShareResponse(context: HandlerContext, voiceChannel: VoiceChannel): InteractionReplyOptions {
        return new HandlerEmbed(context)
            .setDescription(`[Screenshare in ${voiceChannel}](${`https://discordapp.com/channels/${voiceChannel.guild.id}/${voiceChannel.id}`})`)
            .toReplyOptions();
    }

    public async fetchGuildResponse(context: HandlerContext, guild: Guild): Promise<InteractionReplyOptions> {
        const bans = await guild.bans.fetch({ cache: false }).catch(error => {
            if (error.message === 'Missing Permissions') return null;
            throw error;
        })
        const embed = new HandlerEmbed(context)
            .setTitle(`${guild.name} Stats!`)
            .setDescription([
                `Created: **<t:${Math.floor(guild.createdTimestamp / 1000)}:f>**`,
                `Verified: **${guild.verified}**`,
                `Partnered: **${guild.partnered}**`,
                `Premium Tier: **${Util.capitalizeString(guild.premiumTier).replace('_', ' ')}**`,
                `Description: **${guild.description || '*none*'}**`,
                `Channels: **${guild.channels.cache.array().length}**`,
                `Members: **${guild.memberCount}**`,
                `Roles: **${guild.roles.cache.size}**`,
                `Emojis: **${guild.emojis.cache.filter(emoji => !emoji.animated).size}**`,
                `Gif Emojis: **${guild.emojis.cache.filter(emoji => !!emoji.animated).size}**`,
                `Stickers: **TODO**`,
                `NSFW Level: **${Util.capitalizeString(guild.nsfwLevel)}**`,
                `Bans: **${bans ? bans.size : '*administrator permission*'}**`
            ].join('\n'))
        if (guild.icon) embed.setThumbnail(guild.iconURL({ dynamic: true })!);
        if (guild.splash) embed.setImage(`${guild.splashURL({ size: 4096 })}`);
        return embed.toReplyOptions();
    }
}
