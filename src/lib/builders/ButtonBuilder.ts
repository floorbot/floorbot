import Discord, { ActionRowBuilder, ActionRowData, ButtonStyle, MessageActionRowComponent } from 'discord.js';

export type ButtonBuilderData = ConstructorParameters<typeof ButtonBuilder>[0];

export class ButtonBuilder<T = string> extends Discord.ButtonBuilder {

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

    public toActionRow<T>(data?: ActionRowData<MessageActionRowComponent>): ActionRowBuilder<ButtonBuilder<T>> {
        return new ActionRowBuilder<ButtonBuilder<any>>(data).addComponents(this);
    }

    public static viewOnline(url: string): ButtonBuilder {
        return new ButtonBuilder()
            .setURL(url)
            .setStyle(ButtonStyle.Link)
            .setLabel('View Online');
    }
}
