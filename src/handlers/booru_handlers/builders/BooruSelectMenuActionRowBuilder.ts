import { SelectMenuBuilder, SelectMenuBuilderData } from '../../../lib/discord/builders/SelectMenuBuilder.js';
import { SelectMenuActionRowBuilder } from '../../../lib/discord/builders/SelectMenuActionRowBuilder.js';
import { DiscordUtil } from '../../../lib/discord/DiscordUtil.js';
import { BaseBooruData } from './BooruReplyBuilder.js';

export interface BooruSuggestionData extends BaseBooruData {
    readonly url404: string | null;
    readonly suggestions: {
        readonly name: string;
        readonly count: number;
    }[];
}

export enum BooruSelectMenuComponentID {
    Suggestions = 'suggestions'
}

export class BooruSelectMenuActionRowBuilder extends SelectMenuActionRowBuilder {

    public addSuggestionsSelectMenu(booru: BooruSuggestionData, data?: SelectMenuBuilderData): this {
        const selected = booru.query ? booru.query.split('+').map(tag => tag.toLowerCase()) : [];
        const selectMenu = new SelectMenuBuilder(data)
            .setPlaceholder('See Suggested Tags')
            .setCustomId(BooruSelectMenuComponentID.Suggestions)
            .setMinValues(1)
            .setMaxValues(booru.suggestions.length)
            .addOptions(...booru.suggestions.map(suggestion => {
                return {
                    label: DiscordUtil.shortenMessage(suggestion.name, { char: '', append: '...', maxLength: 25 }),
                    description: `${DiscordUtil.formatCommas(suggestion.count)} posts for ${suggestion.name}`,
                    value: suggestion.name,
                    default: selected.includes(suggestion.name.toLowerCase())
                };
            }));
        return this.addComponents(selectMenu);
    }
}
