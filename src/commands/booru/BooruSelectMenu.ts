import { MessageSelectMenu, MessageSelectMenuOptions, Util } from 'discord.js';
import { HandlerSelectMenu } from '../../components/HandlerSelectMenu';
import { BooruSuggestionData } from './BooruHandler';

export class BooruSelectMenu extends HandlerSelectMenu {

    constructor(data?: MessageSelectMenu | MessageSelectMenuOptions) {
        super(data);
    };

    public static createSuggestionSelectMenu(suggestionData: BooruSuggestionData): BooruSelectMenu {
        const selectMenu = new BooruSelectMenu()
            .setPlaceholder('See Suggested Tags')
            .setCustomId('suggestions');
        for (const suggestion of suggestionData.suggestions) {
            selectMenu.addOptions({
                label: Util.splitMessage(suggestion.name, { char: '', append: '...', maxLength: 25 })[0]!,
                value: suggestion.name,
                description: `${suggestion.count} posts for ${suggestion.name}`
            })
        }
        return selectMenu;
    }
}
