import { ButtonActionRowBuilder } from './ButtonActionRowBuilder.js';
import * as Builders from '@discordjs/builders';

export class ButtonBuilder<T = string> extends Builders.ButtonBuilder {

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

    public toActionRow(): ButtonActionRowBuilder {
        return new ButtonActionRowBuilder().addComponents(this);
    }
};
