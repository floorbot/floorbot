import { Client, Collection, Constants, Guild, GuildBan, Interaction, InteractionReplyOptions, Message, MessageActionRow, SelectMenuInteraction, VoiceChannel } from 'discord.js';
import { HandlerButton, HandlerButtonID } from '../../../discord/helpers/components/HandlerButton.js';
import { HandlerReplies } from '../../../discord/helpers/HandlerReplies.js';
import { HandlerUtil } from '../../../discord/HandlerUtil.js';
import { GroupHandlerMap } from './FloorbotHandler.js';
import humanizeDuration from 'humanize-duration';

const { MessageButtonStyles } = Constants;

export const FloorbotButtonID = {
    ...HandlerButtonID, ...{
        GUILD: 'guild',
        ABOUT: 'about'
    }
};

export class FloorbotReplies extends HandlerReplies {

    private getInviteLink(client: Client): string {
        return client.generateInvite({ scopes: ['bot', 'applications.commands'] });
    }

    public createCommandsReply(context: Interaction | Message, groupHandlerMap: GroupHandlerMap, groupComponent?: SelectMenuInteraction, commandsComponent?: SelectMenuInteraction): InteractionReplyOptions {
        const embed = this.createEmbedTemplate(context);
        if (context.guild) embed.setTitle(`Commands for ${context.guild.name}`);
        groupHandlerMap.forEach((handlerMap, group) => {
            const lines: string[] = [];
            handlerMap.forEach((appCommand, handler) => {
                const description = 'description' in handler.data ? handler.data.description : '*Context Menu Command*';
                lines.push(`${appCommand ? '🟢' : '🔴'} \`${handler.toString()}${handler.nsfw ? '\*' : ''}\` - *${description}*`);
            });
            embed.addField(`${group} Commands`, lines.join('\n'), false);
        });


        const groupSelectMenu = this.createSelectMenuTemplate()
            .setCustomId('groups')
            .setPlaceholder('Select a command group')
            .addOptions([...groupHandlerMap.keys()].map(group => {
                return {
                    label: `${group} Commands`,
                    value: group,
                    default: groupComponent && group === groupComponent.values[0]
                };
            }));

        let handlerSelectMenu = this.createSelectMenuTemplate();
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

        return {
            embeds: [embed],
            components: [
                groupSelectMenu.toActionRow(),
                ...(groupComponent ? [handlerSelectMenu.toActionRow()] : []),
                ...(commandsComponent && commandsComponent.values.length ? [new MessageActionRow().addComponents([
                    new HandlerButton().setLabel('Enable Commands').setStyle(MessageButtonStyles.SUCCESS).setCustomId('enable'),
                    new HandlerButton().setLabel('Disable Commands').setStyle(MessageButtonStyles.DANGER).setCustomId('disable')
                ])] : [])
            ]
        };
    }

    public createAboutReply(context: Interaction | Message, replyMessage?: Message): InteractionReplyOptions {
        const { client } = context;

        const embed = this.createEmbedTemplate(context)
            .setDescription([
                (replyMessage ?
                    `Ping: **${humanizeDuration(replyMessage.createdTimestamp - context.createdTimestamp, { units: ['s', 'ms'], round: true })}**` :
                    `Ping: **Pinging...**`),
                (client.ws.ping ? `Heartbeat: **${humanizeDuration(Math.round(client.ws.ping), { units: ['s', 'ms'], round: true })}**` : ''),
                `Uptime: **${humanizeDuration(client.uptime || 0, { largest: 2, round: true })}**`,
                `Invite: **[click me!](${this.getInviteLink(client)})**`
            ]);
        embed.setTitle(client.user ? client.user.tag : 'About');
        embed.setURL(this.getInviteLink(client));
        if (client.user) embed.setThumbnail(client.user.displayAvatarURL());

        const actionRow = new MessageActionRow().addComponents([
            this.createButtonTemplate().setStyle(MessageButtonStyles.PRIMARY).setLabel('About').setLabel('Guild Stats').setCustomId(FloorbotButtonID.GUILD),
            this.createButtonTemplate().setStyle(MessageButtonStyles.LINK).setLabel('Invite Link').setURL(this.getInviteLink(context.client))
        ]);

        return { embeds: [embed], components: replyMessage ? [actionRow] : [] };
    }

    public createGuildReply(context: Interaction | Message, guild: Guild, bans?: Collection<string, GuildBan>): InteractionReplyOptions {
        const embed = this.createEmbedTemplate(context)
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

        const actionRow = new MessageActionRow().addComponents([
            this.createButtonTemplate().setStyle(MessageButtonStyles.PRIMARY).setLabel('About').setCustomId(FloorbotButtonID.ABOUT),
            this.createButtonTemplate().setStyle(MessageButtonStyles.LINK).setLabel('Invite Link').setURL(this.getInviteLink(context.client))
        ]);

        return { embeds: [embed], components: [actionRow] };
    }

    public createScreenshareReply(context: Interaction | Message, channel: VoiceChannel): InteractionReplyOptions {
        return this.createEmbedTemplate(context)
            .setDescription(`[Screenshare in ${channel}](${`https://discordapp.com/channels/${channel.guild.id}/${channel.id}`})`)
            .toReplyOptions();
    }

    public createNoVoiceChannelReply(context: Interaction | Message): InteractionReplyOptions {
        return this.createEmbedTemplate(context)
            .setDescription([
                `Sorry! Please provide or join a voice channel 😦`,
                '*Note: Stage channels and voice channels are different*'
            ])
            .toReplyOptions({ ephemeral: true });
    }
}
