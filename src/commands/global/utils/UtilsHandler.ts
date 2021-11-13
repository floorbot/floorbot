import { ChatInputHandler } from '../../../discord/handler/abstracts/ChatInputHandler.js';
import { HandlerEmbed } from '../../../discord/components/HandlerEmbed.js';
import { HandlerUtil } from '../../../discord/handler/HandlerUtil.js';
import { CommandInteraction, Message } from 'discord.js';
import { UtilsCommandData } from './UtilsCommandData.js';
import humanizeDuration from 'humanize-duration';

export class UtilsHandler extends ChatInputHandler {

    constructor() {
        super({ group: 'Global', global: true, nsfw: false, data: UtilsCommandData });
    }

    public async execute(command: CommandInteraction<'cached'>): Promise<any> {
        const { guild, member } = command;
        const subCommand = command.options.getSubcommand();
        const clientUser = command.client.user!;
        switch (subCommand) {
            case 'ping': {
                const pingingEmbed = new HandlerEmbed().setContextAuthor(command).setDescription('Pinging...');
                await command.reply(pingingEmbed.toReplyOptions());
                const reply = await command.fetchReply() as Message;

                const pingEmbed = new HandlerEmbed()
                    .setContextAuthor(command)
                    .setURL(`https://discord.com/api/oauth2/authorize?client_id=${clientUser.id}&permissions=0&scope=applications.commands%20bot`)
                    .setThumbnail(clientUser.displayAvatarURL())
                    .setTitle(clientUser.tag)
                    .setDescription(
                        `Ping: **${humanizeDuration(reply.createdTimestamp - command.createdTimestamp, { units: ['s', 'ms'], round: true })}**\n` +
                        (command.client.ws.ping ? `Heartbeat: **${humanizeDuration(Math.round(command.client.ws.ping), { units: ['s', 'ms'], round: true })}**\n` : '') +
                        `Uptime: **${humanizeDuration(command.client.uptime || 0, { largest: 2, round: true })}**`
                    );
                return reply.edit(pingEmbed.toReplyOptions());
            }
            case 'guild': {
                if (!guild) return command.reply(new HandlerEmbed().setContextAuthor(command).setDescription(`Sorry! You can only use this command in a guild!`).toReplyOptions());
                await command.deferReply();
                const bans = await guild.bans.fetch({ cache: false }).catch(_error => { return null });
                const embed = new HandlerEmbed()
                    .setContextAuthor(command)
                    .setTitle(`${guild.name} Stats!`)
                    .setDescription([
                        `Created: **<t:${Math.floor(guild.createdTimestamp / 1000)}:f>**`,
                        `Verified: **${guild.verified}**`,
                        `Partnered: **${guild.partnered}**`,
                        `Premium Tier: **${HandlerUtil.capitalizeString(guild.premiumTier).replace('_', ' ')}**`,
                        `Description: **${guild.description || '*none*'}**`,
                        `Channels: **${guild.channels.cache.size}**`,
                        `Members: **${guild.memberCount}**`,
                        `Roles: **${guild.roles.cache.size}**`,
                        `Emojis: **${guild.emojis.cache.filter(emoji => !emoji.animated).size}**`,
                        `Gif Emojis: **${guild.emojis.cache.filter(emoji => !!emoji.animated).size}**`,
                        `Stickers: **${guild.stickers.cache.size}**`,
                        `NSFW Level: **${HandlerUtil.capitalizeString(guild.nsfwLevel)}**`,
                        `Bans: **${bans ? bans.size : '*administrator permission*'}**`
                    ].join('\n'))
                if (guild.icon) embed.setThumbnail(guild.iconURL({ dynamic: true })!);
                if (guild.splash) embed.setImage(`${guild.splashURL({ size: 4096 })}`);
                return command.followUp(embed.toReplyOptions());
            }
            case 'invite': {
                const embed = new HandlerEmbed()
                    .setContextAuthor(command)
                    .setURL(`https://discord.com/api/oauth2/authorize?client_id=${clientUser.id}&permissions=0&scope=applications.commands%20bot`)
                    .setThumbnail(clientUser.displayAvatarURL())
                    .setDescription(`Make sure you have permissions to invite!`)
                    .setTitle(`Invite ${clientUser.tag}`)
                return command.reply(embed.toReplyOptions());
            }
            case 'screenshare': {
                if (!member) return command.reply(new HandlerEmbed().setContextAuthor(command).setDescription(`Sorry! You can only use this command in a guild!`).toReplyOptions());
                await command.deferReply();
                const channel = command.options.getChannel('channel') || member.voice.channel;
                if (!channel) return command.followUp(new HandlerEmbed().setContextAuthor(command).setDescription('Sorry! Please provide or join a voice channel 😦').toReplyOptions());
                return command.followUp(new HandlerEmbed().setContextAuthor(command).setDescription(`[Screenshare in ${channel}](${`https://discordapp.com/channels/${guild.id}/${channel.id}`})`).toReplyOptions());
            }
            default: throw command;
        }
    }
}
