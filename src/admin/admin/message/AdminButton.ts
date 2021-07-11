import { ComponentCustomData, CommandHandler } from 'discord.js-commands';
import { MessageButton, Constants } from 'discord.js';
const { MessageButtonStyles } = Constants;

export interface AdminButtonCustomData extends ComponentCustomData {
    readonly action: 'add' | 'del',
    readonly sub: 'commands',
    readonly handler: string,
    readonly group: string,
}

export class AdminButton extends MessageButton {

    constructor(handler: CommandHandler, sub: 'commands', action: 'add' | 'del') {
        super();

        this.setCustomId(JSON.stringify({
            id: 'admin',
            sub: sub,
            action: action,
            handler: handler.id,
            group: handler.group
        }));

        if (sub === 'commands' && action === 'add') {
            this.setLabel(`Enable ${handler.name}`);
            this.setStyle(MessageButtonStyles.SUCCESS);

        }

        if (sub === 'commands' && action === 'del') {
            this.setLabel(`Disable ${handler.name}`);
            this.setStyle(MessageButtonStyles.DANGER);

        }
    }
}
