import Discord, { ActionRowBuilder, ActionRowData, MessageActionRowComponent, SelectMenuOptionBuilder } from 'discord.js';

export type SelectMenuBuilderData = ConstructorParameters<typeof SelectMenuBuilder>[0];
export type SelectMenuOptionBuilderData = ConstructorParameters<typeof SelectMenuOptionBuilder>[0];

export class SelectMenuBuilder<T = string> extends Discord.SelectMenuBuilder {

    public override setCustomId(data: string | T): this {
        if (typeof data === 'string') return super.setCustomId(data);
        return super.setCustomId(this.encode(data));
    }

    public getCustomId<T>(): T | string | undefined {
        if ('custom_id' in this.data && typeof this.data.custom_id === 'string') {
            try { return JSON.parse(this.data.custom_id); }
            catch { return this.data.custom_id; }
        }
        return undefined;
    }

    public encode<T>(data: T): string {
        return JSON.stringify(data);
    }

    public decode<T>(id: string): T {
        return JSON.parse(id);
    }

    public toActionRow<T>(data?: ActionRowData<MessageActionRowComponent>): ActionRowBuilder<SelectMenuBuilder<T>> {
        return new ActionRowBuilder<SelectMenuBuilder<any>>(data).addComponents(this);
    }
};
