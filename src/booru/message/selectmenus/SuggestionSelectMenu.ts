import { BooruSelectMenu } from '../BooruSelectMenu';
import { BooruHandler } from '../../BooruHandler';
import { User } from 'discord.js';

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
                label: suggestion.name,
                value: suggestion.name,
                description: `${suggestion.count} posts`
            }
        }))
    }
}
