import { Client, Collection, Constants, Guild, GuildBan, Message, SelectMenuInteraction, VoiceChannel } from 'discord.js';
import { SelectMenuBuilder } from '../../../lib/discord/builders/SelectMenuBuilder.js';
import { ActionRowBuilder } from '../../../lib/discord/builders/ActionRowBuilder.js';
import { ButtonBuilder } from '../../../lib/discord/builders/ButtonBuilder.js';
import { ReplyBuilder } from '../../../lib/discord/builders/ReplyBuilder.js';
import { HandlerUtil } from '../../../lib/discord/HandlerUtil.js';
import { GroupHandlerMap } from './FloorbotHandler.js';
import humanizeDuration from 'humanize-duration';

const { MessageButtonStyles } = Constants;

export const FloorbotButtonID = {
    GUILD: 'guild',
    ABOUT: 'about'
};

export class FloorbotReplyBuilder extends ReplyBuilder {

    private getInviteLink(client: Client): string {
        return client.generateInvite({ scopes: ['bot', 'applications.commands'] });
    }

    public addFloorbotCommandsEmbed(groupHandlerMap: GroupHandlerMap, groupComponent?: SelectMenuInteraction, commandsComponent?: SelectMenuInteraction): this {
        const embed = this.createEmbedBuilder();
        if (this.context!.guild) embed.setTitle(`Commands for ${this.context!.guild.name}`);
        groupHandlerMap.forEach((handlerMap, group) => {
            const lines: string[] = [];
            handlerMap.forEach((appCommand, handler) => {
                const description = 'description' in handler.data ? handler.data.description : '*Context Menu Command*';
                lines.push(`${appCommand ? '🟢' : '🔴'} \`${handler.toString()}${handler.nsfw ? '\*' : ''}\` - *${description}*`);
            });
            embed.addField(`${group} Commands`, lines.join('\n'), false);
        });


        const groupSelectMenu = new SelectMenuBuilder()
            .setCustomId('groups')
            .setPlaceholder('Select a command group')
            .addOptions([...groupHandlerMap.keys()].map(group => {
                return {
                    label: `${group} Commands`,
                    value: group,
                    default: groupComponent && group === groupComponent.values[0]
                };
            }));

        let handlerSelectMenu = new SelectMenuBuilder();
        if (groupComponent) {
            const group = groupComponent.values[0]!;
            const handlers = [...groupHandlerMap.get(group)!.keys()];
            handlerSelectMenu.setCustomId('commands');
            handlerSelectMenu.setPlaceholder(`Select ${group.toLowerCase()} commands`);
            for (const [index, handler] of handlers.entries()) {
                const description = 'description' in handler.data ? handler.data.description : '*No Description*';
                handlerSelectMenu.addOptions({
                    label: handler.toString(),
                    value: index.toString(),
                    description: description,
                    default: commandsComponent && commandsComponent.values.includes(index.toString())
                });
            }
            handlerSelectMenu.setMaxValues(handlerSelectMenu.options.length);
        }

        this.addEmbed(embed);
        this.addActionRow(groupSelectMenu.toActionRow());
        if (groupComponent) this.addActionRow(handlerSelectMenu.toActionRow());
        if (commandsComponent && commandsComponent.values.length) this.addFloorbotEnableDisableActionRow();
        return this;
    }

    public addFloorbotEnableDisableActionRow(): this {
        const actionRow = new ActionRowBuilder();
        const enableButton = new ButtonBuilder()
            .setLabel('Enable Commands')
            .setStyle(MessageButtonStyles.SUCCESS)
            .setCustomId('enable');
        const disableButton = new ButtonBuilder()
            .setLabel('Disable Commands')
            .setStyle(MessageButtonStyles.DANGER)
            .setCustomId('disable');
        actionRow.addComponents(enableButton, disableButton);
        return this.addActionRow(actionRow);
    }

    public addFloorbotGuildAboutActionRow(current: string): this {
        const actionRow = new ActionRowBuilder();
        const guildButton = new ButtonBuilder()
            .setStyle(MessageButtonStyles.PRIMARY)
            .setLabel('Guild Stats')
            .setCustomId(FloorbotButtonID.GUILD);
        const aboutButton = new ButtonBuilder()
            .setStyle(MessageButtonStyles.PRIMARY)
            .setLabel('About')
            .setCustomId(FloorbotButtonID.ABOUT);
        const linkButton = new ButtonBuilder()
            .setStyle(MessageButtonStyles.LINK)
            .setLabel('Invite Link')
            .setURL(this.getInviteLink(this.context!.client));
        actionRow.addComponents(
            ...(current != FloorbotButtonID.GUILD ? [guildButton] : []),
            ...(current != FloorbotButtonID.ABOUT ? [aboutButton] : []),
            linkButton
        );
        return this.addActionRow(actionRow);
    }

    public addFloorbotAboutEmbed(replyMessage?: Message): this {
        const { client } = this.context!;
        const embed = this.createEmbedBuilder()
            .setDescription([
                (replyMessage ?
                    `Ping: **${humanizeDuration(replyMessage.createdTimestamp - this.context!.createdTimestamp, { units: ['s', 'ms'], round: true })}**` :
                    `Ping: **Pinging...**`),
                (client.ws.ping ? `Heartbeat: **${humanizeDuration(Math.round(client.ws.ping), { units: ['s', 'ms'], round: true })}**` : ''),
                `Uptime: **${humanizeDuration(client.uptime || 0, { largest: 2, round: true })}**`,
                `Invite: **[click me!](${this.getInviteLink(client)})**`
            ]);
        embed.setTitle(client.user ? client.user.tag : 'About');
        embed.setURL(this.getInviteLink(client));
        if (client.user) embed.setThumbnail(client.user.displayAvatarURL());

        this.addEmbed(embed);
        if (replyMessage) this.addFloorbotGuildAboutActionRow(FloorbotButtonID.ABOUT);

        return this;
    }

    public addFloorbotGuildEmbed(guild: Guild, bans?: Collection<string, GuildBan>): this {
        const embed = this.createEmbedBuilder()
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
            ]);
        if (guild.icon) embed.setThumbnail(guild.iconURL({ dynamic: true })!);
        if (guild.splash) embed.setImage(`${guild.splashURL({ size: 4096 })}`);

        this.addEmbed(embed);
        this.addFloorbotGuildAboutActionRow(FloorbotButtonID.GUILD);

        return this;
    }

    public addFloorbotScreenshareEmbed(channel: VoiceChannel): this {
        const embed = this.createEmbedBuilder()
            .setDescription(`[Screenshare in ${channel}](${`https://discordapp.com/channels/${channel.guild.id}/${channel.id}`})`);
        return this.addEmbed(embed);
    }

    public addFloorbotNoVoiceChannelEmbed(): this {
        const embed = this.createEmbedBuilder()
            .setDescription([
                `Sorry! Please provide or join a voice channel 😦`,
                '*Note: Stage channels and voice channels are different*'
            ]);
        this.setEphemeral();
        return this.addEmbed(embed);
    }
}
