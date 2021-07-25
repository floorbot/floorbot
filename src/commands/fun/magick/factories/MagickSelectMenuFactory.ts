import { MagickHandler, MagickCustomData, MagickAction } from '../../../..';
import { HandlerContext, HandlerSelectMenu } from 'discord.js-commands';
import { Message } from 'discord.js';

export class MagickSelectMenuFactory {

    public static getMagickSelectMenu(handler: MagickHandler, context: HandlerContext, selected?: MagickAction): HandlerSelectMenu<MagickCustomData> {
        const selectMenu = new HandlerSelectMenu(handler);
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
