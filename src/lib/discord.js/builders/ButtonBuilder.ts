import { ActionRowBuilder, ActionRowData, ButtonBuilder, MessageActionRowComponent } from 'discord.js';

export type ButtonBuilderData = ConstructorParameters<typeof ButtonBuilder>[0];

class BetterButtonBuilder<T = string> extends ButtonBuilder {

    public override setCustomId(data: string | T): this {
        if (typeof data === 'string') return super.setCustomId(data);
        return super.setCustomId(this.encode(data));
    }

    public override getCustomId<T>(): T | string | undefined {
        if ('custom_id' in this.data && typeof this.data.custom_id === 'string') {
            try { return JSON.parse(this.data.custom_id); }
            catch { return this.data.custom_id; }
        }
        return undefined;
    }

    public override encode<T>(data: T): string {
        return JSON.stringify(data);
    }

    public override decode<T>(id: string): T {
        return JSON.parse(id);
    }

    public override toActionRow<T>(data?: ActionRowData<MessageActionRowComponent>): ActionRowBuilder<BetterButtonBuilder<T>> {
        return new ActionRowBuilder<BetterButtonBuilder<any>>(data).addComponents(this);
    }
};

declare module 'discord.js' {
    export interface ButtonBuilder<T = string> {
        setCustomId(data: string | T): this;
        getCustomId(): T | string | undefined;
        encode(data: T): string;
        decode(id: string): T;
        toActionRow(data?: ActionRowData<MessageActionRowComponent>): ActionRowBuilder<BetterButtonBuilder<T>>;
    }
};

ButtonBuilder.prototype.setCustomId = BetterButtonBuilder.prototype.setCustomId;
ButtonBuilder.prototype.getCustomId = BetterButtonBuilder.prototype.getCustomId;
ButtonBuilder.prototype.encode = BetterButtonBuilder.prototype.encode;
ButtonBuilder.prototype.decode = BetterButtonBuilder.prototype.decode;
ButtonBuilder.prototype.toActionRow = BetterButtonBuilder.prototype.toActionRow;
