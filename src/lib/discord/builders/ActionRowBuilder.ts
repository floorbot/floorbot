import { Constants, MessageActionRow, MessageActionRowOptions } from 'discord.js';
import { ButtonBuilder } from './ButtonBuilder.js';

const { MessageButtonStyles } = Constants;

export enum ComponentID {
    PREVIOUS_PAGE = 'past_page',
    NEXT_PAGE = 'next_page',
    DELETE = 'delete',
    YES = 'yes',
    NO = 'no'
}

export class ActionRowBuilder extends MessageActionRow {

    constructor(data?: MessageActionRow | MessageActionRowOptions) {
        super(data);
    }

    public addViewOnlineButton(url: string): this {
        const button = new ButtonBuilder()
            .setURL(url)
            .setStyle(MessageButtonStyles.LINK)
            .setLabel('View Online');
        return this.addComponents(button);
    }

    // public addPreviousPageButton(pageable?: null | number | Pageable<any>, disabled?: boolean): this {
    //     const button = new ButtonBuilder()
    //         .setCustomId(ComponentID.PREVIOUS_PAGE)
    //         .setLabel(pageable === undefined || pageable === null ? 'Previous' : `Page ${pageable instanceof Pageable ? pageable.previousPage : pageable - 1}`)
    //         .setStyle(MessageButtonStyles.PRIMARY);
    //     if (disabled) button.setDisabled(disabled);
    //     return this.addComponents(button);
    // }

    // public addNextPageButton(pageable?: null | number | Pageable<any>, disabled?: boolean): this {
    //     const button = new ButtonBuilder()
    //         .setCustomId(ComponentID.NEXT_PAGE)
    //         .setLabel(pageable === undefined || pageable === null ? 'Next' : `Page ${pageable instanceof Pageable ? pageable.nextPage : pageable + 1}`)
    //         .setStyle(MessageButtonStyles.PRIMARY);
    //     if (disabled) button.setDisabled(disabled);
    //     return this.addComponents(button);
    // }

    public addDeleteButton(): this {
        const button = new ButtonBuilder()
            .setLabel('✖️')
            .setStyle(MessageButtonStyles.DANGER)
            .setCustomId(ComponentID.DELETE);
        return this.addComponents(button);
    }

    public addYesButton(): this {
        const button = new ButtonBuilder()
            .setLabel('Yes')
            .setStyle(MessageButtonStyles.SUCCESS)
            .setCustomId(ComponentID.YES);
        return this.addComponents(button);
    }

    public addNoButton(): this {
        const button = new ButtonBuilder()
            .setLabel('No')
            .setStyle(MessageButtonStyles.DANGER)
            .setCustomId(ComponentID.NO);
        return this.addComponents(button);
    }
}
