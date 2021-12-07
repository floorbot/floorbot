import { ButtonBuilder } from "../builders/ButtonBuilder";
import { Constants } from "discord.js";

const { MessageButtonStyles } = Constants;

export enum ButtonID {
    PREVIOUS_PAGE = 'past_page',
    NEXT_PAGE = 'next_page',
    DELETE = 'delete'
}

export class ButtonFactory {

    public createViewOnlineButton(url: string): ButtonBuilder {
        return new ButtonBuilder()
            .setURL(url)
            .setStyle(MessageButtonStyles.LINK)
            .setLabel('View Online');
    }

    public createPreviousPageButton(page?: number): ButtonBuilder {
        return new ButtonBuilder()
            .setCustomId(ButtonID.PREVIOUS_PAGE)
            .setLabel(page === undefined ? 'Previous' : `Page ${page}`)
            .setStyle(MessageButtonStyles.PRIMARY);
    }

    public createNextPageButton(page?: number): ButtonBuilder {
        return new ButtonBuilder()
            .setCustomId(ButtonID.NEXT_PAGE)
            .setLabel(page === undefined ? 'Next' : `Page ${page}`)
            .setStyle(MessageButtonStyles.PRIMARY);
    }

    public createDeleteButton(): ButtonBuilder {
        return new ButtonBuilder()
            .setLabel('✖️')
            .setStyle(MessageButtonStyles.DANGER)
            .setCustomId(ButtonID.DELETE);
    }
}