import { MessageSelectMenu, Message, MessageActionRow } from 'discord.js';
import { HandlerContext, ComponentCustomData } from 'discord.js-commands';

import { MagickAction } from '../MagickConstants';

export interface MagickSelectMenuData extends ComponentCustomData {
    readonly wl: string
}

export class MagickSelectMenu extends MessageSelectMenu {

    constructor(context: HandlerContext, selected?: MagickAction) {
        super();
        const user = context instanceof Message ? context.author : context.user;
        const customData: MagickSelectMenuData = { id: 'magick', wl: user.id };
        this.setCustomId(JSON.stringify(customData));
        this.setPlaceholder('Select a process to apply to the image');
        this.addOptions(Object.entries(MagickAction).map(([id, action]) => {
            return {
                value: id,
                label: action.label,
                default: action === selected,
                description: action.description
            }
        }));
    }

    public asActionRow(): MessageActionRow {
        return new MessageActionRow().addComponents([this])
    }
}
