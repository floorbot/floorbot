import { GuildChannel, MessageEmbed, MessageEmbedOptions, User, Util } from 'discord.js';
import { MarkovChannelSchema, MarkovStringTotals } from '../MarkovDatabase';
import { HandlerEmbed } from '../../../../components/HandlerEmbed';
import { HandlerContext } from '../../../../discord/Util';

export class MarkovEmbed extends HandlerEmbed {

    constructor(context: HandlerContext, data?: MessageEmbed | MessageEmbedOptions) {
        super(data);
        this.setContextAuthor(context);
    }

    public static getControlPanel(context: HandlerContext, channel: GuildChannel, channelData: MarkovChannelSchema, totals: MarkovStringTotals): MarkovEmbed {
        return new MarkovEmbed(context)
            .setDescription(`**Markov Control Panel for ${channel}**`)
            .addField(`Settings`, [
                `${channelData.posting ? '🟢' : '🔴'} Post Messages: **${channelData.posting ? 'Enabled' : 'Disabled'}**`,
                `${channelData.tracking ? '🟢' : '🔴'} Track Messages: **${channelData.tracking ? 'Enabled' : 'Disabled'}**`,
                `${channelData.mentions ? '🟢' : '🔴'} Allow Mentions: **${channelData.mentions ? 'Enabled' : 'Disabled'}**`,
                `${channelData.links ? '🟢' : '🔴'} Allow Links: **${channelData.links ? 'Enabled' : 'Disabled'}**`,
                `${channelData.owoify ? '🟢' : '🔴'} OwOify: **${channelData.owoify ? 'OwO' : 'NOwO'}**`
            ].join('\n'), false)
            .addField('Statistics', [
                `Total Messages: **${Util.formatCommas(totals.total)}**`,
                `User Messages: **${Util.formatCommas(totals.users)}**`,
                'Post frequency:',
                `- One in \`${channelData.messages}\` messages (\`${Util.formatDecimal(100 / channelData.messages, 2)}%\` chance per message)`,
                `- Once every \`${channelData.minutes}\` minutes (\`${Util.formatDecimal(100 / channelData.minutes, 2)}%\` chance per minute)`
            ].join('\n'), false)
    }

    public static getWipeConfirmEmbed(context: HandlerContext, channel: GuildChannel): MarkovEmbed {
        return new MarkovEmbed(context)
            .setDescription([
                `⚠️ Are you sure you want to wipe all saved message data for ${channel}?`,
                `*Please note this is permanent and cannot be undone*`,
            ].join('\n'));
    }

    public static getPurgeConfirmEmbed(context: HandlerContext): MarkovEmbed {
        return new MarkovEmbed(context)
            .setDescription([
                '⚠️ Before you can disable markov all saved data must be purged',
                '⛔ This is irreversible and will hard reset all markov settings for this guild'
            ].join('\n'))
    }

    public static getPurgedEmbed(context: HandlerContext): MarkovEmbed {
        return new MarkovEmbed(context)
            .setDescription(`🦺 You can now safely disable markov!`);
    }

    public static getFailedEmbed(context: HandlerContext, channel: GuildChannel, user: User | null): MarkovEmbed {
        return new MarkovEmbed(context)
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
