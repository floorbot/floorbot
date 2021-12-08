import { BooruBuilderSuggestionData } from "./BooruBuilderInterfaces";
import { ActionRowBuilder, ComponentID } from "../ActionRowBuilder";
import { SelectMenuBuilder } from "../SelectMenuBuilder";
import { ButtonBuilder } from "../ButtonBuilder";
import { Constants, Util } from "discord.js";

const { MessageButtonStyles } = Constants;

export const BooruComponentID = {
    ...ComponentID, ...{
        SUGGESTIONS: 'suggestions',
        RECYCLE: 'recycle',
        REPEAT: 'repeat'
    }
};

export class BooruActionRowBuilder extends ActionRowBuilder {

    public addRecycleButton(): this {
        const button = new ButtonBuilder()
            .setLabel('♻️')
            .setStyle(MessageButtonStyles.SUCCESS)
            .setCustomId(BooruComponentID.RECYCLE);
        return this.addComponents(button);
    }

    public addRepeatButton(tags?: string): this {
        const button = new ButtonBuilder()
            .setLabel(tags ? 'Search Again' : 'Random Again')
            .setStyle(MessageButtonStyles.PRIMARY)
            .setCustomId(BooruComponentID.REPEAT);
        return this.addComponents(button);
    }

    public addSuggestionSelectMenu(data: BooruBuilderSuggestionData): this {
        const selectMenu = new SelectMenuBuilder()
            .setPlaceholder('See Suggested Tags')
            .setCustomId(BooruComponentID.SUGGESTIONS)
            .addOptions(data.suggestions.map(suggestion => {
                return {
                    label: Util.splitMessage(suggestion.name, { char: '', append: '...', maxLength: 25 })[0]!,
                    description: `${suggestion.count} posts for ${suggestion.name}`,
                    value: suggestion.name
                };
            }));
        return this.addComponents(selectMenu);
    }
}