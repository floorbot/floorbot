import { SelectMenuActionRowBuilder } from './SelectMenuActionRowBuilder.js';
import * as Builders from '@discordjs/builders';

export class SelectMenuBuilder<T = string> extends Builders.SelectMenuBuilder {

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

    public toActionRow(): SelectMenuActionRowBuilder {
        return new SelectMenuActionRowBuilder().addComponents(this);
    }
}
