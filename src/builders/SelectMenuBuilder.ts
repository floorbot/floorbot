import { MessageSelectMenu, MessageSelectMenuOptions } from 'discord.js';
import { ActionRowBuilder } from './ActionRowBuilder';

export class SelectMenuBuilder<T = string> extends MessageSelectMenu {

    constructor(data?: MessageSelectMenu | MessageSelectMenuOptions) {
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

    public toActionRow(): ActionRowBuilder {
        return new ActionRowBuilder().addComponents(this);
    }
}
