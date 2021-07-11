import { BooruSelectMenu } from '../BooruSelectMenu';
import { BooruHandler } from '../../BooruHandler';
import { User, Util } from 'discord.js';

export type Suggestion = { name: any, count: any };

export class SuggestionSelectMenu extends BooruSelectMenu {

    constructor(handler: BooruHandler, tag: string, suggestions: Array<Suggestion>, user: User) {
        super(handler);

        this.setPlaceholder('See Suggested Tags');
        this.setCustomId({
            t: tag,
            wl: user.id,
            m: 'e'
        });
        this.addOptions(suggestions.map(suggestion => {
            return {
                label: Util.splitMessage(suggestion.name, { char: '', append: '...', maxLength: 25 })[0],
                value: suggestion.name,
                description: `${suggestion.count} posts for ${suggestion.name}`
            }
        }))
    }
}
