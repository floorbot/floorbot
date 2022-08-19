import { ActionRowBuilder, ActionRowData, ModalActionRowComponent, TextInputBuilder } from 'discord.js';

export type TextInputBuilderData = ConstructorParameters<typeof TextInputBuilder>[0];

class BetterTextInputBuilder<T = string> extends TextInputBuilder {

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

    public override toActionRow<T>(data?: ActionRowData<ModalActionRowComponent>): ActionRowBuilder<BetterTextInputBuilder<T>> {
        return new ActionRowBuilder<BetterTextInputBuilder<any>>(data).addComponents(this);
    }
};

declare module 'discord.js' {
    export interface TextInputBuilder<T = string> {
        setCustomId(data: string | T): this;
        getCustomId(): T | string | undefined;
        encode(data: T): string;
        decode(id: string): T;
        toActionRow(data?: ActionRowData<ModalActionRowComponent>): ActionRowBuilder<BetterTextInputBuilder<T>>;
    }
};

TextInputBuilder.prototype.setCustomId = BetterTextInputBuilder.prototype.setCustomId;
TextInputBuilder.prototype.encode = BetterTextInputBuilder.prototype.encode;
TextInputBuilder.prototype.decode = BetterTextInputBuilder.prototype.decode;
TextInputBuilder.prototype.toActionRow = BetterTextInputBuilder.prototype.toActionRow;
