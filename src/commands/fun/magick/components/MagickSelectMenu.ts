import { HandlerSelectMenu } from '../../../../discord/components/HandlerSelectMenu.js';
import { MessageSelectMenu, MessageSelectMenuOptions } from 'discord.js';
import { MagickAction } from '../MagickConstants.js';

export class MagickSelectMenu extends HandlerSelectMenu {

    constructor(data?: MessageSelectMenu | MessageSelectMenuOptions) {
        super(data);
    }

    public static getMagickSelectMenu(selected?: MagickAction): MagickSelectMenu {
        const selectMenu = new MagickSelectMenu();
        selectMenu.setCustomId('action');
        selectMenu.setPlaceholder('Select a process to apply to the image');
        for (const [id, action] of Object.entries(MagickAction)) {
            selectMenu.addOptions({
                value: id,
                label: action.label,
                default: action === selected,
                description: action.description
            })
        }
        return selectMenu;
    }
}
