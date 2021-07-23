import { AdminHandler, AdminCustomData, GuildCommandHandlerGroup, GuildCommandHandler } from '../../../..';
import { SelectMenuFactory, CommandClient, HandlerContext, HandlerSelectMenu } from 'discord.js-commands';
import { Client, Guild, Util } from 'discord.js';

export class AdminSelectMenuFactory extends SelectMenuFactory<AdminCustomData, AdminHandler> {

    constructor(handler: AdminHandler) {
        super(handler)
    }

    public getGuildHandlerGroupSelectMenu(selected?: GuildCommandHandlerGroup): HandlerSelectMenu<AdminCustomData, AdminHandler> {
        const groups = Object.values(GuildCommandHandlerGroup);
        return new HandlerSelectMenu(this.handler)
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

    public getGuildHandlerSelectMenu(context: HandlerContext, group: GuildCommandHandlerGroup, selected?: Array<GuildCommandHandler>): HandlerSelectMenu<AdminCustomData, AdminHandler> {
        const { client } = <{ client: Client, guild: Guild }>context;
        if (!(client instanceof CommandClient)) throw context;
        const selectMenu = new HandlerSelectMenu(this.handler)
            .setCustomId({ sub: 'commands', group: group })
            .setPlaceholder(`Select ${group.toLowerCase()} commands`)
        for (const handler of client.handlers) {
            if (!(handler instanceof GuildCommandHandler)) continue;
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
