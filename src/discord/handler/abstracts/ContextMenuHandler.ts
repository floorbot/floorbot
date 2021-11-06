import { ContextMenuInteraction, MessageApplicationCommandData, UserApplicationCommandData } from 'discord.js';
import { Handler, HandlerOptions } from '../Handler';

export interface ContextMenuHandlerOptions extends Omit<HandlerOptions, 'type'> {
    readonly data: MessageApplicationCommandData | UserApplicationCommandData
}

export abstract class ContextMenuHandler extends Handler<ContextMenuInteraction> {

    constructor(options: ContextMenuHandlerOptions) {
        super({ type: ContextMenuInteraction, ...options })
    }

    public abstract override execute(contextMenu: ContextMenuInteraction<'cached'>): Promise<any>;

    public override toString(): string {
        return `☰ ${this.data.name}`;
    }
}
