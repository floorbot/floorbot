import { MessageButton, MessageButtonOptions, MessageActionRow, Constants } from 'discord.js';

const { MessageButtonStyles } = Constants;

export enum HandlerButtonID {
    NEXT_PAGE = 'next_page',
    PREVIOUS_PAGE = 'past_page'
}

export class HandlerButton<T = string> extends MessageButton {

    constructor(data?: MessageButton | MessageButtonOptions) {
        super(data);
    }

    public get customData() {
        if (!this.customId) return this.customId;
        if (typeof this.customId === 'string') return this.customId;
        return this.decode(this.customId);
    }

    public override setCustomId(data: string | T): this {
        if (typeof data === 'string') return super.setCustomId(data);
        return super.setCustomId(this.encode(data));
    }

    public encode(data: T): string {
        return JSON.stringify(data);
    }

    public decode(id: string): T {
        return JSON.parse(id);
    }

    public toActionRow(): MessageActionRow {
        return new MessageActionRow().addComponents(this)
    }

    public static createNextPageButton(page?: number): HandlerButton {
        return new HandlerButton()
            .setCustomId(HandlerButtonID.NEXT_PAGE)
            .setLabel(page === undefined ? 'Next' : `Page ${page}`)
            .setStyle(MessageButtonStyles.PRIMARY)
    }

    public static createPreviousPageButton(page?: number): HandlerButton {
        return new HandlerButton()
            .setCustomId(HandlerButtonID.PREVIOUS_PAGE)
            .setLabel(page === undefined ? 'Previous' : `Page ${page}`)
            .setStyle(MessageButtonStyles.PRIMARY)
    }
}
