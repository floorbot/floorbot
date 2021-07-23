import { MagickHandler, MagickCustomData, MagickAction } from '../../../..';
import { SelectMenuFactory, HandlerContext } from 'discord.js-commands';
import { Message } from 'discord.js';

export class MagickSelectMenuFactory extends SelectMenuFactory<MagickCustomData, MagickHandler> {

    constructor(handler: MagickHandler) {
        super(handler);
    }

    public static getMagickSelectMenu(handler: MagickHandler, context: HandlerContext, selected?: MagickAction): MagickSelectMenuFactory {
        const selectMenu = new MagickSelectMenuFactory(handler);
        const user = context instanceof Message ? context.author : context.user;
        selectMenu.setCustomId({ wl: user.id });
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
