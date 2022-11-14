import { MarkovChannelRow } from '../../../app/tables/MarkovChannelTable.js';
import { ReplyBuilder } from '../../../discord/builders/ReplyBuilder.js';
import { Util } from '../../helpers/Util.js';

export class MarkovReplyBuilder extends ReplyBuilder {


    public addControlPanelReply({ settings }: { settings: MarkovChannelRow; }): this {
        const embed = this.createEmbedBuilder()
            .setDescription(`**Markov Control Panel for <#${settings.channel_id}>**`)
            .addFields({
                name: `Settings`, value: [
                    `${settings.posting ? '🟢' : '🔴'} Post Messages: **${settings.posting ? 'Enabled' : 'Disabled'}**`,
                    `${settings.tracking ? '🟢' : '🔴'} Track Messages: **${settings.tracking ? 'Enabled' : 'Disabled'}**`,
                    `${settings.mentions ? '🟢' : '🔴'} Allow Mentions: **${settings.mentions ? 'Enabled' : 'Disabled'}**`,
                    `${settings.links ? '🟢' : '🔴'} Allow Links: **${settings.links ? 'Enabled' : 'Disabled'}**`,
                    `${settings.quoting ? '🟢' : '🔴'} Exact Quoting: **${settings.quoting ? 'Enabled' : 'Disabled'}**`,
                    `${settings.owoify ? '🟢' : '🔴'} OwOify: **${settings.owoify ? 'OwO' : 'NOwO'}**`
                ].join('\n'),
                inline: false
            }, {
                name: 'Statistics', value: [
                    `Total Messages: **${Util.formatCommas(totals.total)}**`,
                    `User Messages: **${Util.formatCommas(totals.users)}**`,
                    'Post frequency:',
                    `- One in \`${settings.messages}\` messages (\`${Util.formatNumber(100 / settings.messages, { significance: 2 })}%\` chance per message)`,
                    `- Once every \`${settings.minutes}\` minutes (\`${Util.formatNumber(100 / settings.minutes, { significance: 2 })}%\` chance per minute)`
                ].join('\n'),
                inline: false
            });
        this.addEmbeds(embed);
        return this;
    }
}
