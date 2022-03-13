import { ActionRowBuilder } from '../../lib/discord/builders/ActionRowBuilder.js';
import { ButtonBuilder } from '../../lib/discord/builders/ButtonBuilder.js';
import { ReplyBuilder } from '../../lib/discord/builders/ReplyBuilder.js';
import { MixinConstructor } from '../../lib/ts-mixin-extended.js';
import { HandlerUtil } from '../../lib/discord/HandlerUtil.js';
import { MarkovStringTotals } from './MarkovStringTable.js';
import { Constants, GuildChannel, User } from 'discord.js';
import { MarkovChannelRow } from './MarkovChannelTable.js';

export enum MarkovButtonType {
    POSTING_ENABLE = 'Enable Posting',
    POSTING_DISABLE = 'Disable Posting',
    TRACKING_ENABLE = 'Enable Tracking',
    TRACKING_DISABLE = 'Disable Tracking',
    LINKS_ENABLE = 'Enable Links',
    LINKS_DISABLE = 'Disable Links',
    MENTIONS_ENABLE = 'Enable Mentions',
    MENTIONS_DISABLE = 'Disable Mentions',
    OWOIFY_ENABLE = 'Enable OwO',
    OWOIFY_DISABLE = 'Disable OwO',
    QUOTING_ENABLE = 'Enable Quoting',
    QUOTING_DISABLE = 'Disable Quoting',
    WIPE = 'Wipe Data',
    WIPE_CONFIRMED = 'Wipe Channel Data',
    PURGE_CONFIRMED = 'Purge All Guild Data',
    BACKOUT = 'Backout'
}

const { MessageButtonStyles } = Constants;

export class MarkovReplyBuilder extends MarkovReplyMixin(ReplyBuilder) { };

export function MarkovReplyMixin<T extends MixinConstructor<ReplyBuilder>>(Builder: T) {
    return class MarkovReplyBuilder extends Builder {

        public addMarkovControlPanel(channel: GuildChannel, channelData: MarkovChannelRow, totals: MarkovStringTotals): this {
            const embed = this.createEmbedBuilder()
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
                ].join('\n'), false);
            return this.addEmbed(embed);
        }

        public addMarkovWipeConfirmEmbed(channel: GuildChannel): this {
            const embed = this.createEmbedBuilder()
                .setDescription([
                    `⚠️ Are you sure you want to wipe all saved message data for ${channel}?`,
                    `*Please note this is permanent and cannot be undone*`,
                ].join('\n'));
            return this.addEmbed(embed);
        }

        public addMarkovPurgeConfirmEmbed(): this {
            const embed = this.createEmbedBuilder()
                .setDescription([
                    '⚠️ Before you can disable markov all saved data must be purged',
                    '⛔ This is irreversible and will hard reset all markov settings for this guild'
                ].join('\n'));
            return this.addEmbed(embed);
        }

        public addMarkovPurgedEmbed(): this {
            const embed = this.createEmbedBuilder()
                .setDescription(`🦺 You can now safely disable markov!`);
            return this.addEmbed(embed);
        }

        public addMarkovFailedEmbed(channel: GuildChannel, user: User | null): this {
            const embed = this.createEmbedBuilder()
                .setDescription([
                    `Sorry! I failed to generate a message for ${channel}${user ? `/${user}` : ''}`,
                    '',
                    'This could be for the following reasons:',
                    ` - *Not enough saved history for this ${channel}${user ? `/${user}` : ''}*`,
                    ' - *An unexpected error occurred during generation*',
                    ' - *Unlucky*',
                    '',
                    '*Please continue to use this channel as normal and try again later*'
                ].join('\n'));
            return this.addEmbed(embed);
        }

        public addMarkovActionRow(channelData: MarkovChannelRow): this {
            const primaryActionRow = new ActionRowBuilder()
                .addComponents(
                    this.getMarkovButton(channelData.posting ? MarkovButtonType.POSTING_DISABLE : MarkovButtonType.POSTING_ENABLE),
                    this.getMarkovButton(channelData.tracking ? MarkovButtonType.TRACKING_DISABLE : MarkovButtonType.TRACKING_ENABLE),
                    this.getMarkovButton(MarkovButtonType.WIPE));
            const secondaryActionRow = new ActionRowBuilder()
                .addComponents(
                    this.getMarkovButton(channelData.mentions ? MarkovButtonType.MENTIONS_DISABLE : MarkovButtonType.MENTIONS_ENABLE),
                    this.getMarkovButton(channelData.links ? MarkovButtonType.LINKS_DISABLE : MarkovButtonType.LINKS_ENABLE),
                    this.getMarkovButton(channelData.owoify ? MarkovButtonType.OWOIFY_DISABLE : MarkovButtonType.OWOIFY_ENABLE),
                    this.getMarkovButton(channelData.quoting ? MarkovButtonType.QUOTING_DISABLE : MarkovButtonType.QUOTING_ENABLE));
            return this.addActionRows(primaryActionRow, secondaryActionRow);
        }

        public addMarkovWipeActionRow(): this {
            const actionRow = new ActionRowBuilder()
                .addComponents(
                    this.getMarkovButton(MarkovButtonType.BACKOUT),
                    this.getMarkovButton(MarkovButtonType.WIPE_CONFIRMED),
                    this.getMarkovButton(MarkovButtonType.PURGE_CONFIRMED)
                );
            return this.addActionRow(actionRow);
        }

        private getMarkovButton(type: MarkovButtonType): ButtonBuilder {
            const button = new ButtonBuilder();
            button.setCustomId(type);
            button.setLabel(type);
            switch (type) {
                case MarkovButtonType.BACKOUT:
                case MarkovButtonType.POSTING_ENABLE:
                case MarkovButtonType.POSTING_DISABLE:
                case MarkovButtonType.TRACKING_ENABLE:
                case MarkovButtonType.TRACKING_DISABLE: {
                    return button.setStyle(MessageButtonStyles.PRIMARY);
                }
                case MarkovButtonType.LINKS_ENABLE:
                case MarkovButtonType.LINKS_DISABLE:
                case MarkovButtonType.MENTIONS_ENABLE:
                case MarkovButtonType.MENTIONS_DISABLE:
                case MarkovButtonType.OWOIFY_ENABLE:
                case MarkovButtonType.OWOIFY_DISABLE:
                case MarkovButtonType.QUOTING_ENABLE:
                case MarkovButtonType.QUOTING_DISABLE: {
                    return button.setStyle(MessageButtonStyles.SECONDARY);
                }
                case MarkovButtonType.WIPE:
                case MarkovButtonType.WIPE_CONFIRMED:
                case MarkovButtonType.PURGE_CONFIRMED: {
                    return button.setStyle(MessageButtonStyles.DANGER);
                }
                default: throw type;
            }
        }
    };
}
