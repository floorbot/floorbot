import { ActionRowBuilder, ModalActionRowComponentBuilder, ModalBuilder } from 'discord.js';

export class BetterModalBuilder extends ModalBuilder {

    public override addActionRow(...components: ModalActionRowComponentBuilder[]): this {
        const actionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(components);
        return this.addComponents(actionRow);
    }
}

declare module 'discord.js' {
    export interface ModalBuilder {
        addActionRow(...components: ModalActionRowComponentBuilder[]): this;
    }
};

ModalBuilder.prototype.addActionRow = BetterModalBuilder.prototype.addActionRow;
