import { GuildChannel, Interaction, MessageEmbed, MessageEmbedOptions, User } from 'discord.js';
import { MarkovChannelRow, MarkovStringTotals } from '../MarkovDatabase.js';
import { HandlerEmbed } from '../../../../helpers/components/HandlerEmbed.js';
import { HandlerUtil } from '../../../../discord/handler/HandlerUtil.js';

export class MarkovEmbed extends HandlerEmbed {

    constructor(interaction: Interaction, data?: MessageEmbed | MessageEmbedOptions) {
        super(data);
        this.setContextAuthor(interaction);
    }

    public static getControlPanel(interaction: Interaction, channel: GuildChannel, channelData: MarkovChannelRow, totals: MarkovStringTotals): MarkovEmbed {
        return new MarkovEmbed(interaction)
            .setDescription(`**Markov Control Panel for ${channel}**`)
            .addField(`Settings`, [
                `${channelData.posting ? '🟢' : '🔴'} Post Messages: **${channelData.posting ? 'Enabled' : 'Disabled'}**`,
                `${channelData.tracking ? '🟢' : '🔴'} Track Messages: **${channelData.tracking ? 'Enabled' : 'Disabled'}**`,
                `${channelData.mentions ? '🟢' : '🔴'} Allow Mentions: **${channelData.mentions ? 'Enabled' : 'Disabled'}**`,
                `${channelData.links ? '🟢' : '🔴'} Allow Links: **${channelData.links ? 'Enabled' : 'Disabled'}**`,
                `${channelData.quoting ? '🟢' : '🔴'} Exact Quoting: **${channelData.quoting ? 'Enabled' : 'Disabled'}**`,
                `${channelData.owoify ? '🟢' : '🔴'} OwOify: **${channelData.owoify ? 'OwO' : 'NOwO'}**`
            ].join('\n'), false)
            .addField('Statistics', [
                `Total Messages: **${HandlerUtil.formatCommas(totals.total)}**`,
                `User Messages: **${HandlerUtil.formatCommas(totals.users)}**`,
                'Post frequency:',
                `- One in \`${channelData.messages}\` messages (\`${HandlerUtil.formatDecimal(100 / channelData.messages, 2)}%\` chance per message)`,
                `- Once every \`${channelData.minutes}\` minutes (\`${HandlerUtil.formatDecimal(100 / channelData.minutes, 2)}%\` chance per minute)`
            ].join('\n'), false)
    }

    public static getWipeConfirmEmbed(interaction: Interaction, channel: GuildChannel): MarkovEmbed {
        return new MarkovEmbed(interaction)
            .setDescription([
                `⚠️ Are you sure you want to wipe all saved message data for ${channel}?`,
                `*Please note this is permanent and cannot be undone*`,
            ].join('\n'));
    }

    public static getPurgeConfirmEmbed(interaction: Interaction): MarkovEmbed {
        return new MarkovEmbed(interaction)
            .setDescription([
                '⚠️ Before you can disable markov all saved data must be purged',
                '⛔ This is irreversible and will hard reset all markov settings for this guild'
            ].join('\n'))
    }

    public static getPurgedEmbed(interaction: Interaction): MarkovEmbed {
        return new MarkovEmbed(interaction)
            .setDescription(`🦺 You can now safely disable markov!`);
    }

    public static getFailedEmbed(interaction: Interaction, channel: GuildChannel, user: User | null): MarkovEmbed {
        return new MarkovEmbed(interaction)
            .setDescription([
                `Sorry! I failed to genereate a message for ${channel}${user ? `/${user}` : ''}`,
                '',
                'This could be for the folllowing reasons:',
                ` - *Not enough saved history for this ${channel}${user ? `/${user}` : ''}*`,
                ' - *An unexpected error occured during generation*',
                ' - *Unlucky*',
                '',
                '*Please continue to use this channel as normal and try again later*'
            ].join('\n'))
    }
}
