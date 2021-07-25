import { BooruHandler, BooruCustomData, BooruSuggestionData } from '../../../..';
import { HandlerSelectMenu } from 'discord.js-commands';
import { User, Util } from 'discord.js';

export class BooruSelectMenuFactory {

    public static getSuggestionSelectMenu(handler: BooruHandler, suggestionData: BooruSuggestionData, user: User): HandlerSelectMenu<BooruCustomData> {
        const selectMenu = new HandlerSelectMenu(handler)
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
