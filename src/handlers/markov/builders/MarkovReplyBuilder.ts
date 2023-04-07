import { channelMention, EmbedBuilder, ModalBuilder } from 'discord.js';
import { FloorbotAttachmentBuilder, FloorbotAvatar } from '../../../core/builders/floorbot/FloorbotAttachmentBuilder.js';
import { ReplyEmbedBuilderOptions } from '../../../core/builders/floorbot/FloorbotReplyBuilder.js';
import { ReplyBuilder } from '../../../core/builders/ReplyBuilder.js';
import { Util } from '../../../core/Util.js';
import { MarkovSettingsRow } from '../tables/MarkovSettingsTable.js';
import { MarkovStateTotals } from '../tables/MarkovStateTable.js';
import { MarkovMessageActionRowBuilder } from './MarkovMessageActionRowBuilder.js';
import { MarkovModalActionRowBuilder } from './MarkovModalActionRowBuilder.js';

export enum MarkovModalId {
    Frequencies = 'frequencies',
    ConfirmDeleteData = 'confirm_delete_data'
}

export class MarkovReplyBuilder extends ReplyBuilder {

    private static EMOJI_MAP = {
        enable: '🟢',
        disable: '🔴',
        suppress: '🔵',
        substitute: '🟣'
    };

    public static getFrequenciesModal({ settings }: { settings: MarkovSettingsRow; }): ModalBuilder {
        return new ModalBuilder()
            .setCustomId(MarkovModalId.Frequencies)
            .setTitle('Markov Posting Frequencies')
            .addComponents(
                new MarkovModalActionRowBuilder().addMessagesTextInput({ settings }),
                new MarkovModalActionRowBuilder().addMinutesTextInput({ settings })
            );
    }

    public static getDeleteMarkovDataModal({ messageCheck }: { messageCheck: string; }): ModalBuilder {
        return new ModalBuilder()
            .setCustomId(MarkovModalId.ConfirmDeleteData)
            .setTitle('Delete markov data for this channel')
            .addComponents(
                new MarkovModalActionRowBuilder().addConfirmMessageTextInput({ messageCheck })
            );
    }

    public override createEmbedBuilder({ context, prefix, suffix }: ReplyEmbedBuilderOptions = {}): EmbedBuilder {
        const clientUser = (context || this.context)?.client?.user;
        const embed = super.createEmbedBuilder({ context, prefix, suffix });
        if (clientUser && !suffix) embed.setFooter({ text: `${prefix ?? 'Powered by'} ${clientUser.username}`, iconURL: clientUser.displayAvatarURL() });
        if (clientUser && suffix) embed.setAuthor({ name: `${clientUser.username} ${suffix}`, iconURL: clientUser.displayAvatarURL() });
        return embed;
    }

    public addControlPanelEmbed({ settings, totals }: { settings: MarkovSettingsRow, totals: MarkovStateTotals; }): this {
        const attachment = FloorbotAttachmentBuilder.avatar({ avatar: FloorbotAvatar.FloorbotYap });
        const embed = this.createEmbedBuilder()
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription(`**Markov Control Panel for ${channelMention(settings.channel_id)}**`)
            .addFields({
                name: `Settings`, value: [
                    `${settings.posting ? '🟢' : '🔴'} Post Messages: **${settings.posting ? 'Enabled' : 'Disabled'}**`,
                    `${settings.tracking ? '🟢' : '🔴'} Track Messages: **${settings.tracking ? 'Enabled' : 'Disabled'}**`,
                    `${MarkovReplyBuilder.EMOJI_MAP[settings.mentions]} Mentions: **${Util.capitaliseString(settings.mentions)}**`,
                    `${MarkovReplyBuilder.EMOJI_MAP[settings.links]} Links: **${Util.capitaliseString(settings.links)}**`,
                    `${settings.owoify ? '🟢' : '🔴'} OwOify: **${settings.owoify ? 'OwO' : 'NOwO'}**`,
                    `${settings.bots ? '🟢' : '🔴'} Bots: **${settings.bots ? 'Enabled' : 'Disabled'}**`
                ].join('\n'),
                inline: false
            }, {
                name: 'Statistics', value: [
                    `Total Messages: **${Util.formatNumber(totals.messages, { commas: true })}**`,
                    `Total Users: **${Util.formatNumber(totals.users, { commas: true })}** (*${Util.formatNumber(totals.bots, { commas: true })} bots*)`,
                    'Post frequency:',
                    `- One in \`${settings.messages}\` messages (${settings.messages ? `\`${Util.formatNumber(100 / settings.messages, { significance: 2 })}%\` chance per message` : 'never'})`,
                    `- Once every \`${settings.minutes}\` minutes (${settings.minutes ? `\`${Util.formatNumber(100 / settings.minutes, { significance: 2 })}%\` chance per minute` : 'never'})`
                ].join('\n'),
                inline: false
            });
        this.addEmbeds(embed);
        this.addFiles(attachment);
        return this;
    }

    public addControlPanelComponents({ settings }: { settings: MarkovSettingsRow; }): this {
        const actionRow = new MarkovMessageActionRowBuilder()
            .addEditFrequenciesButton()
            .addDeleteMarkovDataButton();
        const settingsActionRow = new MarkovMessageActionRowBuilder().addSettingsSelectMenu({ settings });
        const mentionsActionRow = new MarkovMessageActionRowBuilder().addMentionsSelectMenu();
        const LinksActionRow = new MarkovMessageActionRowBuilder().addLinksSelectMenu();
        return this.addComponents(actionRow, settingsActionRow, mentionsActionRow, LinksActionRow);
    }
}
