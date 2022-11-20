import { APIMessage, BaseInteraction, Collection, Guild, GuildBan, GuildNSFWLevel, GuildPremiumTier, Message, ModalSubmitInteraction } from 'discord.js';
import { HandlerContext } from 'discord.js-handlers';
import humanizeDuration from 'humanize-duration';
import { ReplyBuilder } from '../../../discord/builders/ReplyBuilder.js';
import { Util } from '../../../discord/Util.js';
import { FloorbotComponentID, FloorbotMessageActionRow } from './FloorbotActionRow.js';

export class FloorbotReply extends ReplyBuilder {

    public addFloorbotActionRow(context: HandlerContext, inviteURL: string): this {
        const actionRow = new FloorbotMessageActionRow()
            .addInviteButton(inviteURL)
            .addPingButton()
            .addGuildStatsButton(context)
            .addFeedbackButton();
        return this.addComponents(actionRow);
    }

    public addPingEmbed({ inviteURL, interaction, message }: { inviteURL: string, interaction: BaseInteraction, message?: APIMessage | Message; }): this {
        const ping = message ? (message instanceof Message ? message.editedTimestamp ?? message.createdTimestamp : Date.parse(message.edited_timestamp ?? message.timestamp)) - interaction.createdTimestamp : 0;
        const { client } = interaction;
        const embed = this.createEmbedBuilder()
            .setTitle(client.user ? client.user.tag : 'About')
            .setURL(inviteURL)
            .setDescription([
                message ?
                    `Ping: **${humanizeDuration(ping, { units: ['s', 'ms'], round: true })}**` :
                    `Ping: **Pinging...**`,
                ...(client.ws.ping ? [`Heartbeat: **${humanizeDuration(Math.round(client.ws.ping), { units: ['s', 'ms'], round: true })}**`] : []),
                `Uptime: **${humanizeDuration(client.uptime || 0, { largest: 2, round: true })}**`,
                `Invite: **[click me!](${inviteURL})**`
            ].join('\n'));
        if (client.user) embed.setThumbnail(client.user.displayAvatarURL());
        return this.addEmbeds(embed);
    }

    public addGuildEmbed({ guild, bans }: { guild: Guild, bans?: Collection<string, GuildBan>; }): this {
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
        if (guild.description) embed.addFields({ name: 'Description', value: Util.shortenText(guild.description, { maxLength: 1024 }), inline: false });
        if (guild.icon) embed.setThumbnail(guild.iconURL());
        if (guild.splash) embed.setImage(guild.splashURL());
        return this.addEmbeds(embed);
    }

    public addFeedbackEmbed({ modal }: { modal: ModalSubmitInteraction; }): this {
        const feedbackTitle = modal.fields.getTextInputValue(FloorbotComponentID.FeedbackTitle);
        const feedbackMessage = modal.fields.getTextInputValue(FloorbotComponentID.FeedbackMessage);
        const embed = this.createEmbedBuilder()
            .setThumbnail(modal.user.displayAvatarURL())
            .setTitle('Feedback')
            .setDescription([
                `Submitted: **<t:${Math.round(modal.createdTimestamp / 1000)}:f>**`,
                `Guild: **${`${modal.guild ? `${modal.guild} ` : ''}${modal.guildId ? `\`${modal.guildId}\`` : ''}` || '*Direct Message*'}**`,
                `Channel: **${`${modal.channel ? `${modal.channel} ` : ''}${modal.channelId ? `\`${modal.channelId}\`` : ''}` || '*Unknown*'}**`,
                `User: **${modal.user} \`${modal.user.id}\`**`
            ].join('\n'))
            .addFields([
                { name: 'Title', value: feedbackTitle, inline: false },
                { name: 'Description', value: feedbackMessage, inline: false }
            ]);
        return this.addEmbeds(embed);
    }

    public addFeedbackReceivedEmbed(): this {
        const embed = this.createEmbedBuilder()
            .setDescription('Thank you for taking time and submitting feedback!');
        return this.addEmbeds(embed);
    }
}
