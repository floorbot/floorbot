import { MessageActionRowBuilder } from '../../lib/discord.js/builders/ActionRowBuilder.js';
import { APIButtonComponent, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Pageable } from './Pageable.js';

export enum PageableComponentID {
    FirstPage = 'first_page',
    LastPage = 'last_page',
    NextPage = 'next_page',
    PreviousPage = 'previous_page'
}

export class PageableActionRow<T> extends MessageActionRowBuilder {

    public addFirstPageButton(data: Partial<APIButtonComponent> & { pageable?: null | number | Pageable<T>; } = {}): this {
        const button = new ButtonBuilder()
            .setCustomId(PageableComponentID.FirstPage)
            .setStyle(ButtonStyle.Primary)
            .setLabel('First Page');
        if (data.pageable instanceof Pageable) button.setLabel(`Page: ${data.pageable.firstPage + 1}`);
        if (typeof data.pageable === 'number') button.setLabel(`Page: ${data.pageable}`);
        return this.addComponents(button);
    }

    public addLastPageButton(data: Partial<APIButtonComponent> & { pageable?: null | number | Pageable<T>; } = {}): this {
        const button = new ButtonBuilder()
            .setCustomId(PageableComponentID.LastPage)
            .setStyle(ButtonStyle.Primary)
            .setLabel('Last Page');
        if (data.pageable instanceof Pageable) button.setLabel(`Page: ${data.pageable.lastPage + 1}`);
        if (typeof data.pageable === 'number') button.setLabel(`Page: ${data.pageable}`);
        return this.addComponents(button);
    }

    public addNextPageButton(data: Partial<APIButtonComponent> & { pageable?: null | number | Pageable<T>; } = {}): this {
        const button = new ButtonBuilder()
            .setCustomId(PageableComponentID.NextPage)
            .setStyle(ButtonStyle.Primary)
            .setLabel('Next');
        if (data.pageable instanceof Pageable) button.setLabel(`Page: ${data.pageable.nextPage + 1}`);
        if (typeof data.pageable === 'number') button.setLabel(`Page: ${data.pageable}`);
        return this.addComponents(button);
    }

    public addPreviousPageButton(data: Partial<APIButtonComponent> & { pageable?: null | number | Pageable<T>; } = {}): this {
        const button = new ButtonBuilder()
            .setCustomId(PageableComponentID.PreviousPage)
            .setStyle(ButtonStyle.Primary)
            .setLabel('Previous');
        if (data.pageable instanceof Pageable) button.setLabel(`Page: ${data.pageable.previousPage + 1}`);
        if (typeof data.pageable === 'number') button.setLabel(`Page: ${data.pageable}`);
        return this.addComponents(button);
    }
}
