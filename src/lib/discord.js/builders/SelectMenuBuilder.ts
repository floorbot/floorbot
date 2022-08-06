import { ActionRowBuilder, SelectMenuBuilder } from 'discord.js';

class BetterSelectMenuBuilder<T = string> extends SelectMenuBuilder {

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

    public override toActionRow<T>(): ActionRowBuilder<BetterSelectMenuBuilder<T>> {
        return new ActionRowBuilder<BetterSelectMenuBuilder<any>>().addComponents(this);
    }
};

declare module 'discord.js' {
    export interface SelectMenuBuilder<T = string> {
        setCustomId(data: string | T): this;
        getCustomId(): T | string | undefined;
        encode(data: T): string;
        decode(id: string): T;
        toActionRow(): ActionRowBuilder<BetterSelectMenuBuilder<T>>;
    }
};

SelectMenuBuilder.prototype.setCustomId = BetterSelectMenuBuilder.prototype.setCustomId;
SelectMenuBuilder.prototype.encode = BetterSelectMenuBuilder.prototype.encode;
SelectMenuBuilder.prototype.decode = BetterSelectMenuBuilder.prototype.decode;
SelectMenuBuilder.prototype.toActionRow = BetterSelectMenuBuilder.prototype.toActionRow;
