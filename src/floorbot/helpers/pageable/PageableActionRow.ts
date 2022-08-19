import { MessageActionRowBuilder } from '../../../lib/builders/ActionRowBuilder.js';
import { APIButtonComponent, ButtonBuilder, ButtonStyle } from 'discord.js';
import { PageableButtonId } from './PageableButton.js';
import { Pageable } from '../../../lib/Pageable.js';

export type PageableComponentId = PageableButtonId;

export class PageableActionRow<T> extends MessageActionRowBuilder {

    public addFirstPageButton(data: Partial<APIButtonComponent> & { pageable?: null | number | Pageable<T>; } = {}): this {
        const button = new ButtonBuilder()
            .setCustomId(PageableButtonId.FirstPage)
            .setStyle(ButtonStyle.Primary)
            .setLabel('First Page');
        if (data.pageable instanceof Pageable) button.setLabel(`Page: ${data.pageable.firstPage + 1}`);
        if (typeof data.pageable === 'number') button.setLabel(`Page: ${data.pageable}`);
        return this.addComponents(button);
    }

    public addLastPageButton(data: Partial<APIButtonComponent> & { pageable?: null | number | Pageable<T>; } = {}): this {
        const button = new ButtonBuilder()
            .setCustomId(PageableButtonId.LastPage)
            .setStyle(ButtonStyle.Primary)
            .setLabel('Last Page');
        if (data.pageable instanceof Pageable) button.setLabel(`Page: ${data.pageable.lastPage + 1}`);
        if (typeof data.pageable === 'number') button.setLabel(`Page: ${data.pageable}`);
        return this.addComponents(button);
    }

    public addNextPageButton(data: Partial<APIButtonComponent> & { pageable?: null | number | Pageable<T>; } = {}): this {
        const button = new ButtonBuilder()
            .setCustomId(PageableButtonId.NextPage)
            .setStyle(ButtonStyle.Primary)
            .setLabel('Next');
        if (data.pageable instanceof Pageable) button.setLabel(`Page: ${data.pageable.nextPage + 1}`);
        if (typeof data.pageable === 'number') button.setLabel(`Page: ${data.pageable}`);
        return this.addComponents(button);
    }

    public addPreviousPageButton(data: Partial<APIButtonComponent> & { pageable?: null | number | Pageable<T>; } = {}): this {
        const button = new ButtonBuilder()
            .setCustomId(PageableButtonId.PreviousPage)
            .setStyle(ButtonStyle.Primary)
            .setLabel('Previous');
        if (data.pageable instanceof Pageable) button.setLabel(`Page: ${data.pageable.previousPage + 1}`);
        if (typeof data.pageable === 'number') button.setLabel(`Page: ${data.pageable}`);
        return this.addComponents(button);
    }
}
