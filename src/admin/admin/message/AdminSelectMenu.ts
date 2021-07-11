import { MessageSelectMenu, MessageActionRow } from 'discord.js';
import { ComponentCustomData } from 'discord.js-commands';

export interface AdminSelectMenuCustomData extends ComponentCustomData {
    sub: 'commands'
}

export class AdminSelectMenu extends MessageSelectMenu {

    constructor(subCommand: 'commands') {
        super();
        this.setCustomId(JSON.stringify({ id: 'admin', sub: subCommand }))
    }

    public asActionRow() {
        return new MessageActionRow().addComponents(this);
    }
}
