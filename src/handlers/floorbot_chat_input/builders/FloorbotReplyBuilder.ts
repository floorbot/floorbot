import { Collection, Guild, GuildBan, GuildNSFWLevel, GuildPremiumTier, Interaction, Message } from "discord.js";
import { FloorbotButtonActionRowBuilder } from "./FloorbotButtonActionRowBuilder.js";
import { ReplyBuilder } from "../../../lib/discord/builders/ReplyBuilder.js";
import { DiscordUtil } from '../../../lib/discord/DiscordUtil.js';
import { APIMessage } from 'discord-api-types/v9';
import humanizeDuration from "humanize-duration";

export class FloorbotReplyBuilder extends ReplyBuilder {

    public addFloorbotButtonActionRow(inviteURL: string, interaction: Interaction): this {
        const actionRow = new FloorbotButtonActionRowBuilder()
            .addInviteButton(inviteURL)
            .addPingButton()
            .addGuildStatsButton({ disabled: !interaction.guild })
            .addReportBugButton();
        return this.addActionRow(actionRow);
    }

    public addPingEmbed(inviteURL: string, interaction: Interaction, message?: APIMessage | Message): this {
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
        const premiumTier = Object.keys(GuildPremiumTier)[guild.premiumTier] || 'None';
        const nsfwLevel = Object.keys(GuildNSFWLevel)[guild.nsfwLevel] || 'Default';
        const embed = this.createEmbedBuilder()
            .setTitle(`${guild.name} Stats!`)
            .setDescription([
                `Created: **<t:${Math.floor(guild.createdTimestamp / 1000)}:f>**`,
                `Verified: **${guild.verified}**`,
                `Partnered: **${guild.partnered}**`,
                `Premium Tier: **${DiscordUtil.capitalizeString(premiumTier)}**`,
                `Description: **${guild.description || '*none*'}**`,
                `Channels: **${guild.channels.cache.size}**`,
                `Members: **${guild.memberCount}**`,
                `Roles: **${guild.roles.cache.size}**`,
                `Emojis: **${guild.emojis.cache.filter(emoji => !emoji.animated).size}**`,
                `Gif Emojis: **${guild.emojis.cache.filter(emoji => !!emoji.animated).size}**`,
                `Stickers: **${guild.stickers.cache.size}**`,
                `NSFW Level: **${DiscordUtil.capitalizeString(nsfwLevel)}**`,
                `Bans: **${bans ? bans.size : '*administrator permission*'}**`
            ]);
        if (guild.icon) embed.setThumbnail(guild.iconURL());
        if (guild.splash) embed.setImage(guild.splashURL());
        return this.addEmbed(embed);
    }
}
