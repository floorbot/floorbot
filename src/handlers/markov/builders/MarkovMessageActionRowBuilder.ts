import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageActionRowComponentBuilder, SelectMenuBuilder } from 'discord.js';
import { MarkovSettingsRow, MarkovSettingsRowPolicy } from '../tables/MarkovSettingsTable.js';

export enum MarkovButtonId {
    EditFrequencies = 'edit_frequencies',
    DeleteData = 'delete_data'
}

export enum MarkovSelectMenuId {
    Settings = 'settings',
    Mentions = 'mentions',
    Links = 'links'
}

export enum MarkovSettingsSelectMenuOptionValue {
    Posting = 'posting',
    Tracking = 'tracking',
    Owoify = 'owoify',
    Bots = 'bots',
}

export class MarkovMessageActionRowBuilder extends ActionRowBuilder<MessageActionRowComponentBuilder> {

    public addEditFrequenciesButton(): this {
        const button = new ButtonBuilder()
            .setCustomId(MarkovButtonId.EditFrequencies)
            .setStyle(ButtonStyle.Primary)
            .setLabel('Edit Frequencies');
        return this.addComponents(button);
    }

    public addDeleteMarkovDataButton(): this {
        const button = new ButtonBuilder()
            .setCustomId(MarkovButtonId.DeleteData)
            .setStyle(ButtonStyle.Danger)
            .setLabel('Delete Markov Data');
        return this.addComponents(button);
    }

    public addSettingsSelectMenu({ settings }: { settings: MarkovSettingsRow; }): this {
        const selectMenu = new SelectMenuBuilder()
            .setCustomId(MarkovSelectMenuId.Settings)
            .setPlaceholder('Select settings to enable/disable')
            .setMinValues(0)
            .setMaxValues(4)
            .addOptions([
                { value: MarkovSettingsSelectMenuOptionValue.Posting, label: 'Posting', default: Boolean(settings.posting), description: 'Enable automatic message posting' },
                { value: MarkovSettingsSelectMenuOptionValue.Tracking, label: 'Tracking', default: Boolean(settings.tracking), description: 'Enable message tracking' },
                { value: MarkovSettingsSelectMenuOptionValue.Owoify, label: 'OwOify', default: Boolean(settings.owoify), description: 'Make generated messages more fun' },
                { value: MarkovSettingsSelectMenuOptionValue.Bots, label: 'Bot', default: Boolean(settings.bots), description: 'Include bot messages in model training' }
            ]);
        return this.addComponents(selectMenu);
    }

    public addMentionsSelectMenu({ settings }: { settings?: MarkovSettingsRow; } = {}): this {
        const selectMenu = new SelectMenuBuilder()
            .setCustomId(MarkovSelectMenuId.Mentions)
            .setPlaceholder('Select Mention Policy')
            .setMinValues(0)
            .setMaxValues(1)
            .addOptions([
                { value: MarkovSettingsRowPolicy.Enable, label: 'Enabled', default: settings && settings.mentions === 'enable', description: 'Mentions will appear and ping members' },
                { value: MarkovSettingsRowPolicy.Disable, label: 'Disabled', default: settings && settings.mentions === 'disable', description: 'Mentions will not be allowed for generated messages' },
                { value: MarkovSettingsRowPolicy.Substitute, label: 'Substituted', default: settings && settings.mentions === 'substitute', description: 'Mentions will be substituted with [MENTION]' },
                { value: MarkovSettingsRowPolicy.Suppress, label: 'Suppressed', default: settings && settings.mentions === 'suppress', description: 'Mentions will appear without pinging members' }
            ]);
        return this.addComponents(selectMenu);
    }

    public addLinksSelectMenu({ settings }: { settings?: MarkovSettingsRow; } = {}): this {
        const selectMenu = new SelectMenuBuilder()
            .setCustomId(MarkovSelectMenuId.Links)
            .setPlaceholder('Select Link (URL) Policy')
            .setMinValues(0)
            .setMaxValues(1)
            .addOptions([
                { value: MarkovSettingsRowPolicy.Enable, label: 'Enabled', default: settings && settings.links === 'enable', description: 'Links will appear and embed' },
                { value: MarkovSettingsRowPolicy.Disable, label: 'Disabled', default: settings && settings.links === 'disable', description: 'Links will not be allowed for generated messages' },
                { value: MarkovSettingsRowPolicy.Substitute, label: 'Substituted', default: settings && settings.links === 'substitute', description: 'Links will be substituted with [LINK]' },
                { value: MarkovSettingsRowPolicy.Suppress, label: 'Suppressed', default: settings && settings.links === 'suppress', description: 'Links will appear without embeds' }
            ]);
        return this.addComponents(selectMenu);
    }
}
