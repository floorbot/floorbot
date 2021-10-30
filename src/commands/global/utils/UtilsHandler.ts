import { CommandInteraction, Message, Util, GuildMember, Guild } from 'discord.js';
import { UtilsCommandData } from './UtilsCommandData';
import { BaseHandler } from '../../BaseHandler';

// @ts-ignore
import * as DHMS from 'dhms.js';

export class UtilsHandler extends BaseHandler {

    constructor() {
        super({
            id: 'utils',
            group: 'Global',
            global: true,
            nsfw: false,
            data: UtilsCommandData
        })
    }

    public async execute(interaction: CommandInteraction): Promise<any> {
        const { guild, member } = <{ guild: Guild, member: GuildMember }>interaction;
        const subCommand = interaction.options.getSubcommand();
        const clientUser = interaction.client.user!;
        switch (subCommand) {
            case 'ping': {
                const pingingEmbed = this.getEmbedTemplate(interaction).setDescription('Pinging...');
                await interaction.reply(pingingEmbed.toReplyOptions());
                const reply = await interaction.fetchReply() as Message;

                const pingEmbed = this.getEmbedTemplate(interaction)
                    .setURL(`https://discord.com/api/oauth2/authorize?client_id=${clientUser.id}&permissions=0&scope=applications.commands%20bot`)
                    .setThumbnail(clientUser.displayAvatarURL())
                    .setTitle(clientUser.tag)
                    .setDescription(
                        `Ping: **${DHMS.print(reply.createdTimestamp - interaction.createdTimestamp)}**\n` +
                        (interaction.client.ws.ping ? `Heartbeat: **${DHMS.print(Math.round(interaction.client.ws.ping))}**\n` : '') +
                        `Uptime: **${DHMS.print(interaction.client.uptime)}**`
                    );
                return reply.edit(pingEmbed.toReplyOptions());
            }
            case 'guild': {
                if (!guild) return interaction.reply(this.getEmbedTemplate(interaction).setDescription(`Sorry! You can only use this command in a guild!`).toReplyOptions());
                await interaction.deferReply();
                const bans = await guild.bans.fetch({ cache: false }).catch(_error => { return null });
                const embed = this.getEmbedTemplate(interaction)
                    .setTitle(`${guild.name} Stats!`)
                    .setDescription([
                        `Created: **<t:${Math.floor(guild.createdTimestamp / 1000)}:f>**`,
                        `Verified: **${guild.verified}**`,
                        `Partnered: **${guild.partnered}**`,
                        `Premium Tier: **${Util.capitalizeString(guild.premiumTier).replace('_', ' ')}**`,
                        `Description: **${guild.description || '*none*'}**`,
                        `Channels: **${guild.channels.cache.size}**`,
                        `Members: **${guild.memberCount}**`,
                        `Roles: **${guild.roles.cache.size}**`,
                        `Emojis: **${guild.emojis.cache.filter(emoji => !emoji.animated).size}**`,
                        `Gif Emojis: **${guild.emojis.cache.filter(emoji => !!emoji.animated).size}**`,
                        `Stickers: **${guild.stickers.cache.size}**`,
                        `NSFW Level: **${Util.capitalizeString(guild.nsfwLevel)}**`,
                        `Bans: **${bans ? bans.size : '*administrator permission*'}**`
                    ].join('\n'))
                if (guild.icon) embed.setThumbnail(guild.iconURL({ dynamic: true })!);
                if (guild.splash) embed.setImage(`${guild.splashURL({ size: 4096 })}`);
                return interaction.followUp(embed.toReplyOptions());
            }
            case 'invite': {
                const embed = this.getEmbedTemplate(interaction)
                    .setURL(`https://discord.com/api/oauth2/authorize?client_id=${clientUser.id}&permissions=0&scope=applications.commands%20bot`)
                    .setThumbnail(clientUser.displayAvatarURL())
                    .setDescription(`Make sure you have permissions to invite!`)
                    .setTitle(`Invite ${clientUser.tag}`)
                return interaction.reply(embed.toReplyOptions());
            }
            case 'screenshare': {
                if (!member) return interaction.reply(this.getEmbedTemplate(interaction).setDescription(`Sorry! You can only use this command in a guild!`).toReplyOptions());
                await interaction.deferReply();
                const channel = interaction.options.getChannel('channel') || member.voice.channel;
                if (!channel) return interaction.followUp(this.getEmbedTemplate(interaction).setDescription('Sorry! Please provide or join a voice channel 😦').toReplyOptions());
                return interaction.followUp(this.getEmbedTemplate(interaction).setDescription(`[Screenshare in ${channel}](${`https://discordapp.com/channels/${guild.id}/${channel.id}`})`).toReplyOptions());
            }
            default: throw interaction;
        }
    }
}
