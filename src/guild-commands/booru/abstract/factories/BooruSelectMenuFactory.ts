import { BooruHandler, BooruCustomData, BooruSuggestionData } from '../../../..';
import { HandlerSelectMenu, SelectMenuFactory } from 'discord.js-commands';
import { User, Util } from 'discord.js';

export class BooruSelectMenuFactory extends SelectMenuFactory<BooruCustomData, BooruHandler> {

    constructor(handler: BooruHandler) {
        super(handler)
    }

    public getSuggestionSelectMenu(suggestionData: BooruSuggestionData, user: User): HandlerSelectMenu<BooruCustomData, BooruHandler> {
        const selectMenu = new HandlerSelectMenu(this.handler)
            .setPlaceholder('See Suggested Tags')
            .setCustomId({
                t: suggestionData.tags,
                wl: user.id,
                m: 'e'
            });
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
