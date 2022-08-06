import { APIButtonComponent, ButtonBuilder, ButtonStyle } from "discord.js";
import { Pageable } from './Pageable.js';

export enum PageableComponentID {
    FIRST_PAGE = 'first_page',
    LAST_PAGE = 'last_page',
    NEXT_PAGE = 'next_page',
    PREVIOUS_PAGE = 'previous_page'
}

export class PageableComponent {

    public static firstPageButton<T>(data: Partial<APIButtonComponent> & { pageable?: null | number | Pageable<T>; } = {}): ButtonBuilder {
        const button = new ButtonBuilder(data)
            .setCustomId(PageableComponentID.FIRST_PAGE)
            .setStyle(ButtonStyle.Primary)
            .setLabel('First Page');
        if (data.pageable instanceof Pageable) button.setLabel(`Page: ${data.pageable.firstPage + 1}`);
        if (typeof data.pageable === 'number') button.setLabel(`Page: ${data.pageable}`);
        return button;
    }

    public static lastPageButton<T>(data: Partial<APIButtonComponent> & { pageable?: null | number | Pageable<T>; } = {}): ButtonBuilder {
        const button = new ButtonBuilder(data)
            .setCustomId(PageableComponentID.LAST_PAGE)
            .setStyle(ButtonStyle.Primary)
            .setLabel('Last Page');
        if (data.pageable instanceof Pageable) button.setLabel(`Page: ${data.pageable.lastPage + 1}`);
        if (typeof data.pageable === 'number') button.setLabel(`Page: ${data.pageable}`);
        return button;
    }

    public static nextPageButton<T>(data: Partial<APIButtonComponent> & { pageable?: null | number | Pageable<T>; } = {}): ButtonBuilder {
        const button = new ButtonBuilder(data)
            .setCustomId(PageableComponentID.NEXT_PAGE)
            .setStyle(ButtonStyle.Primary)
            .setLabel('Next');
        if (data.pageable instanceof Pageable) button.setLabel(`Page: ${data.pageable.nextPage + 1}`);
        if (typeof data.pageable === 'number') button.setLabel(`Page: ${data.pageable}`);
        return button;
    }

    public static previousPageButton<T>(data: Partial<APIButtonComponent> & { pageable?: null | number | Pageable<T>; } = {}): ButtonBuilder {
        const button = new ButtonBuilder(data)
            .setCustomId(PageableComponentID.PREVIOUS_PAGE)
            .setStyle(ButtonStyle.Primary)
            .setLabel('Previous');
        if (data.pageable instanceof Pageable) button.setLabel(`Page: ${data.pageable.previousPage + 1}`);
        if (typeof data.pageable === 'number') button.setLabel(`Page: ${data.pageable}`);
        return button;
    }
}
