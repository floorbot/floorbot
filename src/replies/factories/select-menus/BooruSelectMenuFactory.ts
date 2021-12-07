import { SelectMenuFactory, SelectMenuID } from "../SelectMenuFactory";
import { SelectMenuBuilder } from "../../builders/SelectMenuBuilder";
import { BooruSuggestionData } from "../interfaces/BooruInterfaces";
import { Util } from "discord.js";

export const BooruSelectMenuID = {
    ...SelectMenuID, ...{
        SUGGESTIONS: 'suggestions'
    }
};

export class BooruSelectMenuFactory extends SelectMenuFactory {

    public createSuggestionSelectMenu(data: BooruSuggestionData): SelectMenuBuilder {
        return new SelectMenuBuilder()
            .setPlaceholder('See Suggested Tags')
            .setCustomId(BooruSelectMenuID.SUGGESTIONS)
            .addOptions(data.suggestions.map(suggestion => {
                return {
                    label: Util.splitMessage(suggestion.name, { char: '', append: '...', maxLength: 25 })[0]!,
                    description: `${suggestion.count} posts for ${suggestion.name}`,
                    value: suggestion.name
                };
            }));
    }
}