import { TextInputActionRowBuilder } from './TextInputActionRowBuilder.js';
import * as Builders from '@discordjs/builders';

export type TextInputBuilderData = ConstructorParameters<typeof TextInputBuilder>[0];

export class TextInputBuilder<T = string> extends Builders.TextInputBuilder {

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

    public toActionRow(): TextInputActionRowBuilder {
        return new TextInputActionRowBuilder().addComponents(this);
    }
};
