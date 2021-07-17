import { MarkovChannelSchema, MarkovStringTotals } from '../../MarkovDatabase';
import { HandlerContext } from 'discord.js-commands';
import { MarkovEmbed } from './MarkovEmbed';
import { GuildChannel } from 'discord.js';

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
            `- One in \`${channelData.messages}\` messages (\`${Math.round(100 / channelData.messages)}%\` chance per message)`,
            `- Once every \`${channelData.minutes}\` minutes (\`${Math.round(100 / channelData.minutes)}%\` chance per minute)`
        ].join('\n'), false)
    }
}
