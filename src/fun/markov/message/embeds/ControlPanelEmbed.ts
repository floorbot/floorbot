import { MarkovChannelSchema, MarkovStringTotals } from '../../MarkovDatabase';
import { HandlerContext } from 'discord.js-commands';
import { MarkovEmbed } from './MarkovEmbed';
import { GuildChannel } from 'discord.js';

export class ControlPanelEmbed extends MarkovEmbed {

    constructor(context: HandlerContext, channel: GuildChannel, channelData: MarkovChannelSchema, totals: MarkovStringTotals) {
        super(context);

        this.setTitle(`Markov Control Panel for #${channel.name}`)
        this.setDescription([
            `channel: **${channel}**`,
            `status: **${channelData.enabled ? 'enabled' : 'disabled'}**`,
            `Total Messages: **${totals.total}**`,
            `User Messages: **${totals.users}**`,
            'Post frequency:',
            `- One in \`${channelData.messages}\` messages (\`${(100 / channelData.messages).toFixed(1)}%\` chance per message)`,
            `- Once every \`${channelData.minutes}\` minutes (\`${(1 / channelData.messages).toFixed(1)}%\` chance per minute)`
        ].join('\n'));
    }
}
