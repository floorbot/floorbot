import { AdminSelectMenu } from '../AdminSelectMenu';
import { CommandHandler } from 'discord.js-commands';

export class HandlerSelectMenu extends AdminSelectMenu {
    constructor(handlers: Array<CommandHandler>, selected?: string) {
        super('commands');
        this.setPlaceholder('Select a command')
        this.addOptions(handlers.map(handler => ({
            label: handler.name,
            value: JSON.stringify({ group: handler.group, command: handler.id }),
            description: handler.commandData.description,
            default: handler.id === selected
        })));
    }
}
