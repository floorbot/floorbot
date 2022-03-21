import { PageableButtonActionRowBuilder } from '../../../lib/builders/PageableButtonActionRowBuilder.js';
import { ButtonBuilder, ButtonBuilderData } from '../../../lib/discord/builders/ButtonBuilder.js';
import { BooruRow } from '../BooruTable.js';
import { ButtonStyle } from 'discord.js';

export enum BooruButtonComponentID {
    Image = 'image',
    Tags = 'tags',
    Repeat = 'repeat',
    Recycle = 'recycle'
}

export class BooruButtonActionRowBuilder extends PageableButtonActionRowBuilder<BooruRow> {

    public addImageButton(data?: ButtonBuilderData): this {
        const button = new ButtonBuilder(data)
            .setLabel('Image')
            .setStyle(ButtonStyle.Primary)
            .setCustomId(BooruButtonComponentID.Image);
        return this.addComponents(button);
    }

    public addTagsButton(data?: ButtonBuilderData): this {
        const button = new ButtonBuilder(data)
            .setLabel('Tags')
            .setStyle(ButtonStyle.Primary)
            .setCustomId(BooruButtonComponentID.Tags);
        return this.addComponents(button);
    }

    public addRepeatButton(tags?: string | null, data?: ButtonBuilderData): this {
        const button = new ButtonBuilder(data)
            .setLabel(tags ? 'Search Again' : 'Random Again')
            .setStyle(ButtonStyle.Primary)
            .setCustomId(BooruButtonComponentID.Repeat);
        return this.addComponents(button);
    }

    public addRecycleButton(data?: ButtonBuilderData): this {
        const button = new ButtonBuilder(data)
            .setLabel('♻️')
            .setStyle(ButtonStyle.Success)
            .setCustomId(BooruButtonComponentID.Recycle);
        return this.addComponents(button);
    }
}
