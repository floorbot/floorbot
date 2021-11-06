import { HandlerSelectMenu, HandlerSelectMenuID } from '../../discord/components/HandlerSelectMenu';
import { MessageSelectMenu, MessageSelectMenuOptions, Util } from 'discord.js';
import { BooruSuggestionData } from './BooruHandler';

export const BooruSelectMenuID = {
    ...HandlerSelectMenuID, ...{
        SUGGESTIONS: 'suggestions'
    }
};

export class BooruSelectMenu extends HandlerSelectMenu {

    constructor(data?: MessageSelectMenu | MessageSelectMenuOptions) {
        super(data);
    };

    public static createSuggestionSelectMenu(suggestionData: BooruSuggestionData): BooruSelectMenu {
        return new BooruSelectMenu()
            .setPlaceholder('See Suggested Tags')
            .setCustomId(BooruSelectMenuID.SUGGESTIONS)
            .addOptions(suggestionData.suggestions.map(suggestion => {
                return {
                    label: Util.splitMessage(suggestion.name, { char: '', append: '...', maxLength: 25 })[0]!,
                    description: `${suggestion.count} posts for ${suggestion.name}`,
                    value: suggestion.name
                };
            }));
    }
}
