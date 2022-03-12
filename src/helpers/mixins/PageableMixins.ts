import { ActionRowBuilder } from "../../lib/discord/builders/ActionRowBuilder.js";
import { ButtonBuilder } from "../../lib/discord/builders/ButtonBuilder.js";
import { MixinConstructor } from "../../lib/ts-mixin-extended.js";
import { Pageable } from "../Pageable.js";
import { Constants } from "discord.js";

const { MessageButtonStyles } = Constants;

export enum PageableComponentID {
    FIRST_PAGE = 'first_page',
    LAST_PAGE = 'last_page',
    NEXT_PAGE = 'next_page',
    PREVIOUS_PAGE = 'previous_page'
}

export class PageableActionRowBuilder extends PageableActionRowMixin(ActionRowBuilder) { };

export function PageableActionRowMixin<T extends MixinConstructor<ActionRowBuilder>>(Builder: T) {
    return class PageableActionRowBuilder extends Builder {

        public addFirstPageButton(pageable?: null | number | Pageable<T>, disabled?: boolean): this {
            const button = new ButtonBuilder()
                .setCustomId(PageableComponentID.FIRST_PAGE)
                .setStyle(MessageButtonStyles.PRIMARY)
                .setLabel('First Page')
                .setDisabled(disabled ?? false);
            if (pageable instanceof Pageable) button.setLabel(`Page: ${pageable.firstPage + 1}`);
            if (typeof pageable === 'number') button.setLabel(`Page: ${pageable}`);
            return this.addComponents(button);
        }

        public addLastPageButton(pageable?: null | number | Pageable<T>, disabled?: boolean): this {
            const button = new ButtonBuilder()
                .setCustomId(PageableComponentID.LAST_PAGE)
                .setStyle(MessageButtonStyles.PRIMARY)
                .setLabel('Last Page')
                .setDisabled(disabled ?? false);
            if (pageable instanceof Pageable) button.setLabel(`Page: ${pageable.lastPage + 1}`);
            if (typeof pageable === 'number') button.setLabel(`Page: ${pageable}`);
            return this.addComponents(button);
        }

        public addNextPageButton<T>(pageable?: null | number | Pageable<T>, disabled?: boolean): this {
            const button = new ButtonBuilder()
                .setCustomId(PageableComponentID.NEXT_PAGE)
                .setStyle(MessageButtonStyles.PRIMARY)
                .setDisabled(disabled ?? false)
                .setLabel('Next');
            if (pageable instanceof Pageable) button.setLabel(`Page: ${pageable.nextPage + 1}`);
            if (typeof pageable === 'number') button.setLabel(`Page: ${pageable}`);
            return this.addComponents(button);
        }

        public addPreviousPageButton<T>(pageable?: null | number | Pageable<T>, disabled?: boolean): this {
            const button = new ButtonBuilder()
                .setCustomId(PageableComponentID.PREVIOUS_PAGE)
                .setStyle(MessageButtonStyles.PRIMARY)
                .setDisabled(disabled ?? false)
                .setLabel('Previous');
            if (pageable instanceof Pageable) button.setLabel(`Page: ${pageable.previousPage + 1}`);
            if (typeof pageable === 'number') button.setLabel(`Page: ${pageable}`);
            return this.addComponents(button);
        }
    };
}
