import { MarkovChannelSchema, MarkovStringTotals } from '../../MarkovDatabase';
import { HandlerContext } from 'discord.js-commands';
import { GuildChannel, Util } from 'discord.js';
import { MarkovEmbed } from './MarkovEmbed';

export class ControlPanelEmbed extends MarkovEmbed {

    constructor(context: HandlerContext, channel: GuildChannel, channelData: MarkovChannelSchema, totals: MarkovStringTotals) {
        super(context);
        this.setDescription(`**Markov Control Panel for ${channel}**`)
        this.addField(`Settings`, [
            `${channelData.posting ? '🟢' : '🔴'} Post Messages: **${channelData.posting ? 'Enabled' : 'Disabled'}**`,
            `${channelData.tracking ? '🟢' : '🔴'} Track Messages: **${channelData.tracking ? 'Enabled' : 'Disabled'}**`,
            `${channelData.mentions ? '🟢' : '🔴'} Allow Mentions: **${channelData.mentions ? 'Enabled' : 'Disabled'}**`,
            `${channelData.links ? '🟢' : '🔴'} Allow Links: **${channelData.links ? 'Enabled' : 'Disabled'}**`
        ].join('\n'), false)
        this.addField('Statistics', [
            `Total Messages: **${totals.total}**`,
            `User Messages: **${totals.users}**`,
            'Post frequency:',
            `- One in \`${channelData.messages}\` messages (\`${Util.formatDecimal(100 / channelData.messages, 2)}%\` chance per message)`,
            `- Once every \`${channelData.minutes}\` minutes (\`${Util.formatDecimal(100 / channelData.minutes, 2)}%\` chance per minute)`
        ].join('\n'), false)
    }
}
