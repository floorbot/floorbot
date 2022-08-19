import { ButtonBuilder, ButtonStyle } from 'discord.js';
import { Pageable } from '../../../lib/Pageable.js';

export enum PageableButtonId {
    FirstPage = 'first_page',
    LastPage = 'last_page',
    NextPage = 'next_page',
    PreviousPage = 'previous_page'
}

export class PageableButton extends ButtonBuilder {

    public static firstPage<T>(pageable?: null | number | Pageable<T>): PageableButton {
        const button = new PageableButton()
            .setCustomId(PageableButtonId.FirstPage)
            .setStyle(ButtonStyle.Primary)
            .setLabel('First Page');
        if (pageable instanceof Pageable) button.setLabel(`Page: ${pageable.firstPage + 1}`);
        if (typeof pageable === 'number') button.setLabel(`Page: ${pageable}`);
        return button;
    }

    public static lastPage<T>(pageable?: null | number | Pageable<T>): PageableButton {
        const button = new ButtonBuilder()
            .setCustomId(PageableButtonId.LastPage)
            .setStyle(ButtonStyle.Primary)
            .setLabel('Last Page');
        if (pageable instanceof Pageable) button.setLabel(`Page: ${pageable.lastPage + 1}`);
        if (typeof pageable === 'number') button.setLabel(`Page: ${pageable}`);
        return button;
    }

    public static nextPage<T>(pageable?: null | number | Pageable<T>): PageableButton {
        const button = new ButtonBuilder()
            .setCustomId(PageableButtonId.NextPage)
            .setStyle(ButtonStyle.Primary)
            .setLabel('Next');
        if (pageable instanceof Pageable) button.setLabel(`Page: ${pageable.nextPage + 1}`);
        if (typeof pageable === 'number') button.setLabel(`Page: ${pageable}`);
        return button;
    }

    public static previousPage<T>(pageable?: null | number | Pageable<T>): PageableButton {
        const button = new ButtonBuilder()
            .setCustomId(PageableButtonId.PreviousPage)
            .setStyle(ButtonStyle.Primary)
            .setLabel('Previous');
        if (pageable instanceof Pageable) button.setLabel(`Page: ${pageable.previousPage + 1}`);
        if (typeof pageable === 'number') button.setLabel(`Page: ${pageable}`);
        return button;
    }
}
