import { MessageSelectMenu, MessageSelectMenuOptions, SelectMenuInteraction } from 'discord.js';
import { HandlerSelectMenu } from '../../../components/HandlerSelectMenu';
import { GroupHandlerMap } from './AdminHandler';

export class AdminSelectMenu extends HandlerSelectMenu {

    constructor(data?: MessageSelectMenu | MessageSelectMenuOptions) {
        super(data);
    };

    public static createGroupsSelectMenu(groupHandlerMap: GroupHandlerMap, groupComponent?: SelectMenuInteraction): AdminSelectMenu {
        const selectMenu = new AdminSelectMenu()
            .setCustomId('groups')
            .setPlaceholder('Select a command group')
            .addOptions([...groupHandlerMap.keys()].map(group => {
                return {
                    label: `${group} Commands`,
                    value: group,
                    default: groupComponent && group === groupComponent.values[0]
                }
            }))
        return selectMenu;
    }

    public static createHandlerSelectMenu(groupHandlerMap: GroupHandlerMap, groupComponent: SelectMenuInteraction, commandsComponent?: SelectMenuInteraction): AdminSelectMenu {
        const group = groupComponent.values[0]!;
        const selectMenu = new AdminSelectMenu()
            .setCustomId('commands')
            .setPlaceholder(`Select ${group.toLowerCase()} commands`)
        for (const { handler } of groupHandlerMap.get(group)!.values()) {
            const prefix = (handler.data.type === 'MESSAGE' || handler.data.type === 'USER') ? '☰ ' : '/'
            selectMenu.addOptions({
                label: `${prefix}${handler.data.name}`,
                value: handler.id,
                description: handler.description,
                default: commandsComponent && commandsComponent.values.includes(handler.id)
            });
        }
        selectMenu.setMaxValues(selectMenu.options.length);
        return selectMenu;
    }
}
