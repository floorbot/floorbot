import { Constants, MessageActionRow, MessageActionRowOptions } from 'discord.js';
import { ButtonBuilder } from './ButtonBuilder';

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

    public addPreviousPageButton(page?: number): this {
        const button = new ButtonBuilder()
            .setCustomId(ComponentID.PREVIOUS_PAGE)
            .setLabel(page === undefined ? 'Previous' : `Page ${page}`)
            .setStyle(MessageButtonStyles.PRIMARY);
        return this.addComponents(button);
    }

    public addNextPageButton(page?: number): this {
        const button = new ButtonBuilder()
            .setCustomId(ComponentID.NEXT_PAGE)
            .setLabel(page === undefined ? 'Next' : `Page ${page}`)
            .setStyle(MessageButtonStyles.PRIMARY);
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
