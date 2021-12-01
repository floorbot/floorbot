import { MessageSelectMenu, MessageSelectMenuOptions, SelectMenuInteraction } from 'discord.js';
import { HandlerSelectMenu } from '../../../discord/helpers/components/HandlerSelectMenu.js';
import { GroupHandlerMap } from './FloorbotHandler.js';

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
        const handlers = [...groupHandlerMap.get(group)!.keys()];
        const selectMenu = new AdminSelectMenu()
            .setCustomId('commands')
            .setPlaceholder(`Select ${group.toLowerCase()} commands`);
        for (const [index, handler] of handlers.entries()) {
            const description = 'description' in handler.data ? handler.data.description : '*No Description*';
            selectMenu.addOptions({
                label: handler.toString(),
                value: index.toString(),
                description: description,
                default: commandsComponent && commandsComponent.values.includes(index.toString())
            });
        }
        selectMenu.setMaxValues(selectMenu.options.length);
        return selectMenu;
    }
}
