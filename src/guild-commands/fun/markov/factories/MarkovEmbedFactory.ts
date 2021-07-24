import { MarkovChannelSchema, MarkovStringTotals } from '../../../..';
import { EmbedFactory, HandlerContext, HandlerEmbed } from 'discord.js-commands';
import { GuildChannel, User, Util } from 'discord.js';
import { MarkovHandler } from '../MarkovHandler';

export class MarkovEmbedFactory extends EmbedFactory<MarkovHandler> {

    constructor(handler: MarkovHandler) {
        super(handler)
    }

    public getControlPanel(context: HandlerContext, channel: GuildChannel, channelData: MarkovChannelSchema, totals: MarkovStringTotals): HandlerEmbed {
        return new HandlerEmbed(context)
            .setDescription(`**Markov Control Panel for ${channel}**`)
            .addField(`Settings`, [
                `${channelData.posting ? '🟢' : '🔴'} Post Messages: **${channelData.posting ? 'Enabled' : 'Disabled'}**`,
                `${channelData.tracking ? '🟢' : '🔴'} Track Messages: **${channelData.tracking ? 'Enabled' : 'Disabled'}**`,
                `${channelData.mentions ? '🟢' : '🔴'} Allow Mentions: **${channelData.mentions ? 'Enabled' : 'Disabled'}**`,
                `${channelData.links ? '🟢' : '🔴'} Allow Links: **${channelData.links ? 'Enabled' : 'Disabled'}**`
            ].join('\n'), false)
            .addField('Statistics', [
                `Total Messages: **${totals.total}**`,
                `User Messages: **${totals.users}**`,
                'Post frequency:',
                `- One in \`${channelData.messages}\` messages (\`${Util.formatDecimal(100 / channelData.messages, 2)}%\` chance per message)`,
                `- Once every \`${channelData.minutes}\` minutes (\`${Util.formatDecimal(100 / channelData.minutes, 2)}%\` chance per minute)`
            ].join('\n'), false)
    }

    public getMissingAdminEmbed(context: HandlerContext): HandlerEmbed {
        return new HandlerEmbed(context)
            .setDescription(`Sorry! you must be an admin to use the markov control panel!`);
    }

    public getWipeConfirmEmbed(context: HandlerContext, channel: GuildChannel): HandlerEmbed {
        return new HandlerEmbed(context)
            .setDescription([
                `⚠️ Are you sure you want to wipe all saved message data for ${channel}?`,
                `*Please note this is permanent and cannot be undone*`,
            ].join('\n'));
    }

    public getPurgeConfirmEmbed(context: HandlerContext): HandlerEmbed {
        return new HandlerEmbed(context)
            .setDescription([
                '⚠️ Before you can disable markov all saved data must be purged',
                '⛔ This is irreversible and will hard reset all markov settings for this guild'
            ].join('\n'))
    }

    public getPurgedEmbed(context: HandlerContext): HandlerEmbed {
        return new HandlerEmbed(context)
            .setDescription(`🦺 You can now safely disable markov!`);
    }

    public getFailedEmbed(context: HandlerContext, channel: GuildChannel, user: User | null): HandlerEmbed {
        return new HandlerEmbed(context)
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
