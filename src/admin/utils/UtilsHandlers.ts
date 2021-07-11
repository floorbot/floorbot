import { ApplicationCommandData, CommandInteraction, Util, MessageEmbed, Message, GuildMember } from 'discord.js';
import { CommandClient, BaseHandler, CommandHandler, HandlerContext } from 'discord.js-commands';
import { UtilsCommandData } from './UtilsCommandData';

// @ts-ignore
import * as DHMS from 'dhms.js';

export class UtilsHandler extends BaseHandler implements CommandHandler {

    public readonly commandData: ApplicationCommandData;
    public readonly isGlobal: boolean;

    constructor(client: CommandClient) {
        super(client, { id: 'utils', name: 'Utils', group: 'Admin', nsfw: false });
        this.commandData = UtilsCommandData;
        this.isGlobal = true;
    }

    public async onCommand(interaction: CommandInteraction): Promise<any> {
        const { client, guild, member, webhook } = interaction;

        if (!guild || !member) return;

        if (interaction.options.has('ping')) {
            await interaction.reply({ embeds: [this.getEmbedTemplate(interaction).setDescription('Pinging...')] })
            const reply = <Message>(await interaction.fetchReply());
            const embed = this.getEmbedTemplate(interaction)
                .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user!.id}&permissions=0&scope=applications.commands%20bot`)
                .setThumbnail(client.user!.displayAvatarURL())
                .setTitle(client.user!.tag)
                .setDescription(
                    `Ping: **${DHMS.print(reply.createdTimestamp - interaction.createdTimestamp)}**\n` +
                    (client.ws.ping ? `Heartbeat: **${DHMS.print(Math.round(client.ws.ping))}**\n` : '') +
                    `Uptime: **${DHMS.print(client.uptime)}**`
                );
            return interaction.editReply({ embeds: [embed] });
        }

        if (interaction.options.has('guild')) {
            await interaction.defer({ ephemeral: false });
            return guild.bans.fetch({ cache: false }).catch(error => {
                if (error.message === 'Missing Permissions') return Promise.resolve(null);
                return Promise.reject(error);
            }).then(bans => {
                const embed = this.getEmbedTemplate(interaction)
                    .setTitle(`${guild.name} Stats!`)
                    .setDescription(
                        `Created: **<t:${guild.createdTimestamp}:f>**\n` +
                        `Verified: **${guild.verified}**\n` +
                        `Partnered: **${guild.partnered}**\n` +
                        `Premium Tier: **${Util.capitalizeString(guild.premiumTier).replace('_', ' ')}**\n` +
                        `Description: **${guild.description}**\n` +
                        `Channels: **${guild.channels.cache.array().length}**\n` +
                        `Members: **${guild.memberCount}**\n` +
                        `Roles: **${guild.roles.cache.array().length}**\n` +
                        `Emojis: **${guild.emojis.cache.array().filter(emoji => !emoji.animated).length}**\n` +
                        `Gif Emojis: **${guild.emojis.cache.array().filter(emoji => emoji.animated).length}**\n` +
                        `Stickers: **TODO**\n` +
                        `NSFW Level: **${Util.capitalizeString(guild.nsfwLevel)}**\n` +
                        `Bans: **${bans ? bans.array().length : '*administrator permission*'}**\n`
                    )
                if (guild.icon) embed.setThumbnail(guild.iconURL({ dynamic: true })!);
                if (guild.splash) embed.setImage(`${guild.splashURL({ size: 4096 })}`);
                return webhook.send({ embeds: [embed] });
            })
        }

        if (interaction.options.has('invite')) {
            const embed = this.getEmbedTemplate(interaction)
                .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user!.id}&permissions=0&scope=applications.commands%20bot`)
                .setThumbnail(client.user!.displayAvatarURL())
                .setDescription(`Make sure you have permissions to invite!`)
                .setTitle(`Invite ${client.user!.tag}`);
            return interaction.reply({ embeds: [embed] });
        }

        if (interaction.options.has('screenshare')) {
            await interaction.defer({ ephemeral: false });
            const subCommand = interaction.options.get('screenshare');
            const channelID: any = subCommand ?.options ?.get('channel') ?.value || (<GuildMember>member).voice.channel ?.id;
            if (!channelID) return webhook.send({ embeds: [this.getEmbedTemplate(interaction).setDescription('Sorry! Please provide or join a voice channel 😦')] });
            const voiceChannel = (await client.channels.fetch(channelID))!;
            if (voiceChannel.type !== 'GUILD_VOICE') return webhook.send({ embeds: [this.getEmbedTemplate(interaction).setDescription(`Sorry! ${voiceChannel} is not a voice channel... 😶`)] });
            return webhook.send({ embeds: [this.getEmbedTemplate(interaction).setDescription(`[Screenshare in ${voiceChannel}](${`https://discordapp.com/channels/${guild.id}/${voiceChannel.id}`})`)] });
        }
    }

    public getEmbedTemplate(context: HandlerContext): MessageEmbed {
        const { member } = context;
        const user = context instanceof Message ? context.author : context.user;
        const displayName = context.member ? (<GuildMember>member).displayName : user.username;
        return super.getEmbedTemplate(context)
            .setAuthor(displayName, user.displayAvatarURL());
    }
}
