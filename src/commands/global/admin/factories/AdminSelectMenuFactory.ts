import { AdminHandler, AdminCustomData, GuildHandler, GuildHandlerGroup } from '../../../..';
import { CommandClient, HandlerContext, HandlerSelectMenu } from 'discord.js-commands';
import { Client, Guild, Util } from 'discord.js';

export class AdminSelectMenuFactory {

    public static getGuildHandlerGroupSelectMenu(handler: AdminHandler, selected?: GuildHandlerGroup): HandlerSelectMenu<AdminCustomData> {
        const groups = Object.values(GuildHandlerGroup);
        return new HandlerSelectMenu(handler)
            .setCustomId({ sub: 'commands' })
            .setPlaceholder('Select a command group')
            .addOptions(groups.map(group => {
                return {
                    label: `${group} Commands`,
                    value: group,
                    default: group === selected
                }
            }))
    }

    public static getGuildHandlerSelectMenu(handler: AdminHandler, context: HandlerContext, group: GuildHandlerGroup, selected?: Array<GuildHandler<any>>): HandlerSelectMenu<AdminCustomData> {
        const { client } = <{ client: Client, guild: Guild }>context;
        if (!(client instanceof CommandClient)) throw context;
        const selectMenu = new HandlerSelectMenu(handler)
            .setCustomId({ sub: 'commands', group: group })
            .setPlaceholder(`Select ${group.toLowerCase()} commands`)
        for (const handler of client.handlers) {
            if (!(handler instanceof GuildHandler)) continue;
            if (handler.group !== group) continue;
            selectMenu.addOptions({
                label: Util.capitalizeString(handler.id),
                value: handler.id,
                description: handler.commandData.description,
                default: selected && selected.includes(handler)
            });
        }
        selectMenu.setMaxValues(selectMenu.options.length);
        return selectMenu;
    }
}
