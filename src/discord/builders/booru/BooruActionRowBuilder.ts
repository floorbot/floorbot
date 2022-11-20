import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SelectMenuBuilder } from 'discord.js';
import { Util } from '../../Util.js';

export enum BooruMessageComponentId {
    Suggestions = 'suggestions',
    Recycle = 'recycle',
    Image = 'image',
    Tags = 'tags'
}

export class BooruActionRowBuilder extends ActionRowBuilder {

    public override addRecycleButton(): this {
        const button = new ButtonBuilder()
            .setLabel('♻')
            .setStyle(ButtonStyle.Success)
            .setCustomId(BooruMessageComponentId.Recycle);
        return this.addComponents(button);
    }

    public override addImageButton(): this {
        const button = new ButtonBuilder()
            .setLabel('Image')
            .setStyle(ButtonStyle.Primary)
            .setCustomId(BooruMessageComponentId.Image);
        return this.addComponents(button);
    }

    public override addTagsButton({ disabled }: { disabled?: boolean; } = {}): this {
        const button = new ButtonBuilder({ disabled })
            .setLabel('Tags')
            .setStyle(ButtonStyle.Primary)
            .setCustomId(BooruMessageComponentId.Tags);
        return this.addComponents(button);
    }

    public override addSuggestionsSelectMenu(suggestions: { name: string; count: number; }[]): this {
        suggestions = suggestions.slice(0, 25);
        const selectMenu = new SelectMenuBuilder()
            .setMinValues(1)
            .setMaxValues(suggestions.length)
            .setPlaceholder('See Suggested Tags')
            .setCustomId(BooruMessageComponentId.Suggestions)
            .addOptions(...suggestions.map(suggestion => {
                return {
                    label: Util.shortenText(suggestion.name, { char: '', append: '...', maxLength: 25 }),
                    description: `${Util.formatNumber(suggestion.count, { commas: true })} posts for ${suggestion.name}`,
                    value: suggestion.name,
                };
            }));
        return this.addComponents(selectMenu);
    }
}

declare module 'discord.js' {
    export interface ActionRowBuilder {
        addRecycleButton(): this;
        addImageButton(): this;
        addTagsButton({ disabled }: { disabled?: boolean; }): this;
        addSuggestionsSelectMenu(suggestions: { name: string; count: number; }[]): this;
    }
};

ActionRowBuilder.prototype.addRecycleButton = BooruActionRowBuilder.prototype.addRecycleButton;
ActionRowBuilder.prototype.addImageButton = BooruActionRowBuilder.prototype.addImageButton;
ActionRowBuilder.prototype.addTagsButton = BooruActionRowBuilder.prototype.addTagsButton;
ActionRowBuilder.prototype.addSuggestionsSelectMenu = BooruActionRowBuilder.prototype.addSuggestionsSelectMenu;
