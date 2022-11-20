import Discord, { ActionRowBuilder, ModalActionRowComponentBuilder } from 'discord.js';

export class ModalBuilder extends Discord.ModalBuilder {

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

Discord.ModalBuilder.prototype.addActionRow = ModalBuilder.prototype.addActionRow;
