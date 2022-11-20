import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Pageable } from '../../discord/Pageable.js';

export enum PageableButtonId {
    FirstPage = 'first_page',
    LastPage = 'last_page',
    NextPage = 'next_page',
    PreviousPage = 'previous_page'
}

export class PageableActionRowBuilder extends ActionRowBuilder {

    public override addFirstPageButton<T>({ pageable, disabled = false }: { pageable?: null | number | Pageable<T>, disabled?: boolean; } = {}): this {
        const button = new ButtonBuilder()
            .setCustomId(PageableButtonId.FirstPage)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(disabled)
            .setLabel('First Page');
        if (pageable instanceof Pageable) button.setLabel(`Page: ${pageable.firstPage + 1}`);
        if (typeof pageable === 'number') button.setLabel(`Page: ${pageable}`);
        return this.addComponents(button);
    }

    public override  addLastPageButton<T>({ pageable, disabled = false }: { pageable?: null | number | Pageable<T>, disabled?: boolean; } = {}): this {
        const button = new ButtonBuilder()
            .setCustomId(PageableButtonId.LastPage)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(disabled)
            .setLabel('Last Page');
        if (pageable instanceof Pageable) button.setLabel(`Page: ${pageable.lastPage + 1}`);
        if (typeof pageable === 'number') button.setLabel(`Page: ${pageable}`);
        return this.addComponents(button);
    }

    public override addNextPageButton<T>({ pageable, disabled = false }: { pageable?: null | number | Pageable<T>, disabled?: boolean; } = {}): this {
        const button = new ButtonBuilder()
            .setCustomId(PageableButtonId.NextPage)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(disabled)
            .setLabel('Next');
        if (pageable instanceof Pageable) button.setLabel(`Page: ${pageable.nextPage + 1}`);
        if (typeof pageable === 'number') button.setLabel(`Page: ${pageable}`);
        return this.addComponents(button);
    }

    public override addPreviousPageButton<T>({ pageable, disabled = false }: { pageable?: null | number | Pageable<T>, disabled?: boolean; } = {}): this {
        const button = new ButtonBuilder()
            .setCustomId(PageableButtonId.PreviousPage)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(disabled)
            .setLabel('Previous');
        if (pageable instanceof Pageable) button.setLabel(`Page: ${pageable.previousPage + 1}`);
        if (typeof pageable === 'number') button.setLabel(`Page: ${pageable}`);
        return this.addComponents(button);
    }
}

declare module 'discord.js' {
    export interface ActionRowBuilder {
        addFirstPageButton<T>({ pageable, disabled }?: { pageable?: null | number | Pageable<T>, disabled?: boolean; }): this;
        addLastPageButton<T>({ pageable, disabled }?: { pageable?: null | number | Pageable<T>, disabled?: boolean; }): this;
        addNextPageButton<T>({ pageable, disabled }?: { pageable?: null | number | Pageable<T>, disabled?: boolean; }): this;
        addPreviousPageButton<T>({ pageable, disabled }?: { pageable?: null | number | Pageable<T>, disabled?: boolean; }): this;
    }
};

ActionRowBuilder.prototype.addFirstPageButton = PageableActionRowBuilder.prototype.addFirstPageButton;
ActionRowBuilder.prototype.addLastPageButton = PageableActionRowBuilder.prototype.addLastPageButton;
ActionRowBuilder.prototype.addNextPageButton = PageableActionRowBuilder.prototype.addNextPageButton;
ActionRowBuilder.prototype.addPreviousPageButton = PageableActionRowBuilder.prototype.addPreviousPageButton;
