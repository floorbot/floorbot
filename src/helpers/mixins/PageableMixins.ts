import { ActionRowBuilder } from "../../lib/discord/builders/ActionRowBuilder.js";
import { ButtonBuilder } from "../../lib/discord/builders/ButtonBuilder.js";
import { MixinConstructor } from "../../lib/ts-mixin-extended.js";
import { Pageable } from "../Pageable.js";
import { Constants } from "discord.js";

const { MessageButtonStyles } = Constants;

export enum PageableComponentID {
    FIRST_CHAPTER = 'first_chapter',
    PREVIOUS_CHAPTER = 'previous_chapter',
    NEXT_CHAPTER = 'next_chapter',
    LAST_CHAPTER = 'last_chapter',
    FIRST_PAGE = 'first_page',
    NEXT_PAGE = 'next_page',
    PREVIOUS_PAGE = 'previous_page',
    LAST_PAGE = 'last_page'
}

export class PageableActionRowBuilder extends PageableActionRowMixin(ActionRowBuilder) { };

export function PageableActionRowMixin<T extends MixinConstructor<ActionRowBuilder>>(Builder: T) {
    return class PageableActionRowBuilder extends Builder {

        public addFirstPageButton(pageable?: null | number | Pageable<T>, disabled?: boolean): this {
            const button = new ButtonBuilder()
                .setCustomId(PageableComponentID.FIRST_PAGE)
                .setStyle(MessageButtonStyles.PRIMARY)
                .setLabel('First Page')
                .setDisabled(disabled);
            if (pageable instanceof Pageable) button.setLabel(`Page: ${pageable.firstPage}`);
            if (typeof pageable === 'number') button.setLabel(`Page: ${pageable}`);
            return this.addComponents(button);
        }

        public addLastPageButton(pageable?: null | number | Pageable<T>, disabled?: boolean): this {
            const button = new ButtonBuilder()
                .setCustomId(PageableComponentID.LAST_PAGE)
                .setStyle(MessageButtonStyles.PRIMARY)
                .setLabel('First Page')
                .setDisabled(disabled);
            if (pageable instanceof Pageable) button.setLabel(`Page: ${pageable.lastPage}`);
            if (typeof pageable === 'number') button.setLabel(`Page: ${pageable}`);
            return this.addComponents(button);
        }

        public addPreviousPageButton<T>(pageable?: null | number | Pageable<T>, disabled?: boolean): this {
            const button = new ButtonBuilder()
                .setCustomId(PageableComponentID.PREVIOUS_PAGE)
                .setStyle(MessageButtonStyles.PRIMARY)
                .setDisabled(disabled)
                .setLabel('Previous');
            if (pageable instanceof Pageable) button.setLabel(`Page: ${pageable.previousPage}`);
            if (typeof pageable === 'number') button.setLabel(`Page: ${pageable}`);
            return this.addComponents(button);
        }

        public addNextPageButton<T>(pageable?: null | number | Pageable<T>, disabled?: boolean): this {
            const button = new ButtonBuilder()
                .setCustomId(PageableComponentID.NEXT_PAGE)
                .setStyle(MessageButtonStyles.PRIMARY)
                .setDisabled(disabled)
                .setLabel('Next');
            if (pageable instanceof Pageable) button.setLabel(`Page: ${pageable.nextPage}`);
            if (typeof pageable === 'number') button.setLabel(`Page: ${pageable}`);
            return this.addComponents(button);
        }

        public addFirstChapterButton(pageable?: null | number | Pageable<T>, disabled?: boolean): this {
            const button = new ButtonBuilder()
                .setCustomId(PageableComponentID.FIRST_CHAPTER)
                .setStyle(MessageButtonStyles.PRIMARY)
                .setLabel('First Chapter')
                .setDisabled(disabled);
            if (pageable instanceof Pageable) button.setLabel(`Chapter: ${pageable.firstChapter}`);
            if (typeof pageable === 'number') button.setLabel(`Chapter: ${pageable}`);
            return this.addComponents(button);
        }

        public addLastChapterButton(pageable?: null | number | Pageable<T>, disabled?: boolean): this {
            const button = new ButtonBuilder()
                .setCustomId(PageableComponentID.LAST_CHAPTER)
                .setStyle(MessageButtonStyles.PRIMARY)
                .setLabel('First Page')
                .setDisabled(disabled);
            if (pageable instanceof Pageable) button.setLabel(`Chapter: ${pageable.lastChapter}`);
            if (typeof pageable === 'number') button.setLabel(`Chapter: ${pageable}`);
            return this.addComponents(button);
        }

        public addPreviousChapterButton<T>(pageable?: null | number | Pageable<T>, disabled?: boolean): this {
            const button = new ButtonBuilder()
                .setCustomId(PageableComponentID.PREVIOUS_CHAPTER)
                .setStyle(MessageButtonStyles.PRIMARY)
                .setDisabled(disabled)
                .setLabel('Previous');
            if (pageable instanceof Pageable) button.setLabel(`Chapter: ${pageable.previousChapter}`);
            if (typeof pageable === 'number') button.setLabel(`Chapter: ${pageable}`);
            return this.addComponents(button);
        }

        public addNextChapterButton<T>(pageable?: null | number | Pageable<T>, disabled?: boolean): this {
            const button = new ButtonBuilder()
                .setCustomId(PageableComponentID.NEXT_CHAPTER)
                .setStyle(MessageButtonStyles.PRIMARY)
                .setDisabled(disabled)
                .setLabel('Next');
            if (pageable instanceof Pageable) button.setLabel(`Chapter: ${pageable.nextChapter}`);
            if (typeof pageable === 'number') button.setLabel(`Chapter: ${pageable}`);
            return this.addComponents(button);
        }
    };
}
