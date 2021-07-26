import { MarkovHandler, MarkovChannelSchema, MarkovStringTotals } from '../../../..';
import { HandlerContext, HandlerEmbed } from 'discord.js-commands';
import { GuildChannel, User, Util } from 'discord.js';

export class MarkovEmbedFactory {

    public static getControlPanel(handler: MarkovHandler, context: HandlerContext, channel: GuildChannel, channelData: MarkovChannelSchema, totals: MarkovStringTotals): HandlerEmbed {
        return handler.getEmbedTemplate(context)
            .setDescription(`**Markov Control Panel for ${channel}**`)
            .addField(`Settings`, [
                `${channelData.posting ? '🟢' : '🔴'} Post Messages: **${channelData.posting ? 'Enabled' : 'Disabled'}**`,
                `${channelData.tracking ? '🟢' : '🔴'} Track Messages: **${channelData.tracking ? 'Enabled' : 'Disabled'}**`,
                `${channelData.mentions ? '🟢' : '🔴'} Allow Mentions: **${channelData.mentions ? 'Enabled' : 'Disabled'}**`,
                `${channelData.links ? '🟢' : '🔴'} Allow Links: **${channelData.links ? 'Enabled' : 'Disabled'}**`,
                `${channelData.owoify ? '🟢' : '🔴'} OwOify: **${channelData.owoify ? 'OwO' : 'NOwO'}**`
            ].join('\n'), false)
            .addField('Statistics', [
                `Total Messages: **${totals.total}**`,
                `User Messages: **${totals.users}**`,
                'Post frequency:',
                `- One in \`${channelData.messages}\` messages (\`${Util.formatDecimal(100 / channelData.messages, 2)}%\` chance per message)`,
                `- Once every \`${channelData.minutes}\` minutes (\`${Util.formatDecimal(100 / channelData.minutes, 2)}%\` chance per minute)`
            ].join('\n'), false)
    }

    public static getWipeConfirmEmbed(handler: MarkovHandler, context: HandlerContext, channel: GuildChannel): HandlerEmbed {
        return handler.getEmbedTemplate(context)
            .setDescription([
                `⚠️ Are you sure you want to wipe all saved message data for ${channel}?`,
                `*Please note this is permanent and cannot be undone*`,
            ].join('\n'));
    }

    public static getPurgeConfirmEmbed(handler: MarkovHandler, context: HandlerContext): HandlerEmbed {
        return handler.getEmbedTemplate(context)
            .setDescription([
                '⚠️ Before you can disable markov all saved data must be purged',
                '⛔ This is irreversible and will hard reset all markov settings for this guild'
            ].join('\n'))
    }

    public static getPurgedEmbed(handler: MarkovHandler, context: HandlerContext): HandlerEmbed {
        return handler.getEmbedTemplate(context)
            .setDescription(`🦺 You can now safely disable markov!`);
    }

    public static getFailedEmbed(handler: MarkovHandler, context: HandlerContext, channel: GuildChannel, user: User | null): HandlerEmbed {
        return handler.getEmbedTemplate(context)
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
