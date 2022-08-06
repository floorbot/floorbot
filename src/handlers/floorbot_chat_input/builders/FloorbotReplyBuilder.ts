import { APIMessage, BaseInteraction, Collection, Guild, GuildBan, GuildNSFWLevel, GuildPremiumTier, Message, ModalSubmitInteraction } from "discord.js";
import { ReplyBuilder } from '../../../lib/builders/ReplyBuilder.js';
import { FloorbotComponent } from './FloorbotComponent.js';
import humanizeDuration from 'humanize-duration';
import { Util } from '../../../helpers/Util.js';

export class FloorbotReplyBuilder extends ReplyBuilder {

    public addFloorbotButtonActionRow(inviteURL: string, interaction: BaseInteraction): this {
        return this.addActionRow(
            FloorbotComponent.inviteButton({ inviteURL: inviteURL }),
            FloorbotComponent.pingButton(),
            FloorbotComponent.guildStatsButton({ disabled: !interaction.inGuild() }),
            FloorbotComponent.feedbackButton()
        );
    }

    public addPingEmbed(inviteURL: string, interaction: BaseInteraction, message?: APIMessage | Message): this {
        const { client } = interaction;
        const embed = this.createEmbedBuilder()
            .setTitle(client.user ? client.user.tag : 'About')
            .setURL(inviteURL)
            .setDescription([
                message ?
                    `Ping: **${humanizeDuration((message instanceof Message ?
                        message.editedTimestamp ?? message.createdTimestamp :
                        Date.parse(message.edited_timestamp ?? message.timestamp)
                    ) - interaction.createdTimestamp, { units: ['s', 'ms'], round: true })}**` :
                    `Ping: **Pinging...**`,
                ...(client.ws.ping ? [`Heartbeat: **${humanizeDuration(Math.round(client.ws.ping), { units: ['s', 'ms'], round: true })}**`] : []),
                `Uptime: **${humanizeDuration(client.uptime || 0, { largest: 2, round: true })}**`,
                `Invite: **[click me!](${inviteURL})**`
            ]);
        if (client.user) embed.setThumbnail(client.user.displayAvatarURL());
        return this.addEmbed(embed);
    }

    public addGuildEmbed(guild: Guild, bans?: Collection<string, GuildBan>): this {
        const member = guild.members.me;
        const lines = [
            `Created: **<t:${Math.floor(guild.createdTimestamp / 1000)}:f>**`,
            `Joined: **${member && member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:f>` : '*unknown*'}**`,
            `Verified: **${Util.capitaliseString(guild.verified)}**`,
            `Partnered: **${Util.capitaliseString(guild.partnered)}**`,
            `Premium Tier: **${Util.capitaliseString(GuildPremiumTier[guild.premiumTier]!)}**`,
            `Description: **${guild.description ? 'True' : 'False'}**`,
            `Channels: **${guild.channels.cache.size}**`,
            `Members: **${guild.memberCount}**`,
            `Roles: **${guild.roles.cache.size}**`,
            `Emojis: **${guild.emojis.cache.filter(emoji => !emoji.animated).size}**`,
            `Gif Emojis: **${guild.emojis.cache.filter(emoji => !!emoji.animated).size}**`,
            `Stickers: **${guild.stickers.cache.size}**`,
            `NSFW Level: **${Util.capitaliseString(GuildNSFWLevel[guild.nsfwLevel]!)}**`,
            `Bans: **${bans ? bans.size : '*administrator permission*'}**`
        ];
        const half = Math.ceil(lines.length / 2);
        const embed = this.createEmbedBuilder();
        embed.addFields(
            { name: `${guild.name} Stats!`, value: lines.slice(0, half).join('\n'), inline: true },
            { name: '\u200b', value: lines.slice(-half).join('\n'), inline: true }
        );
        if (guild.description) embed.addField({ name: 'Description', value: guild.description, inline: false });
        if (guild.icon) embed.setThumbnail(guild.iconURL());
        if (guild.splash) embed.setImage(guild.splashURL());
        return this.addEmbed(embed);
    }

    public addFeedbackEmbed(modal: ModalSubmitInteraction, feedbackTitle: string, feedbackDescription: string): this {
        const embed = this.createEmbedBuilder()
            .setThumbnail(modal.user.displayAvatarURL())
            .setTitle('Feedback')
            .setDescription([
                `Submitted: **<t:${Math.round(modal.createdTimestamp / 1000)}:f>**`,
                `Guild: **${`${modal.guild ? `${modal.guild} ` : ''}${modal.guildId ? `\`${modal.guildId}\`` : ''}` || '*Direct Message*'}**`,
                `Channel: **${`${modal.channel ? `${modal.channel} ` : ''}${modal.channelId ? `\`${modal.channelId}\`` : ''}` || '*Unknown*'}**`,
                `User: **${modal.user} \`${modal.user.id}\`**`
            ])
            .addFields([
                { name: 'Title', value: feedbackTitle, inline: false },
                { name: 'Description', value: feedbackDescription, inline: false }
            ]);
        return this.addEmbed(embed);
    }

    public addFeedbackReceivedEmbed(): this {
        const embed = this.createEmbedBuilder()
            .setDescription('Thank you for taking time and submitting feedback!');
        return this.addEmbed(embed);
    }
}
