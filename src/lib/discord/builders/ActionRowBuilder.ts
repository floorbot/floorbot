import { Constants, MessageActionRow, MessageActionRowOptions } from 'discord.js';
import { ButtonBuilder } from './ButtonBuilder.js';

const { MessageButtonStyles } = Constants;

export enum ComponentID {
    PREVIOUS_PAGE = 'past_page',
    NEXT_PAGE = 'next_page',
    DELETE = 'delete'
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

    public addPreviousPageButton(currentPage?: number, disabled?: boolean): this {
        const button = new ButtonBuilder()
            .setCustomId(ComponentID.PREVIOUS_PAGE)
            .setLabel(currentPage === undefined ? 'Previous' : `Page ${currentPage - 1}`)
            .setStyle(MessageButtonStyles.PRIMARY);
        if (disabled) button.setDisabled(disabled);
        return this.addComponents(button);
    }

    public addNextPageButton(currentPage?: number, disabled?: boolean): this {
        const button = new ButtonBuilder()
            .setCustomId(ComponentID.NEXT_PAGE)
            .setLabel(currentPage === undefined ? 'Next' : `Page ${currentPage + 1}`)
            .setStyle(MessageButtonStyles.PRIMARY);
        if (disabled) button.setDisabled(disabled);
        return this.addComponents(button);
    }

    public addDeleteButton(): this {
        const button = new ButtonBuilder()
            .setLabel('✖️')
            .setStyle(MessageButtonStyles.DANGER)
            .setCustomId(ComponentID.DELETE);
        return this.addComponents(button);
    }
}
