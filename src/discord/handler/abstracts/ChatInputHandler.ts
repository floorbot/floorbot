import { ChatInputApplicationCommandData, CommandInteraction } from 'discord.js';
import { Handler, HandlerOptions } from '../Handler.js';

export interface ChatInputHandlerOptions extends Omit<HandlerOptions, 'type'> {
    readonly data: ChatInputApplicationCommandData
}

export abstract class ChatInputHandler extends Handler<CommandInteraction> {

    constructor(options: ChatInputHandlerOptions) {
        super({ type: CommandInteraction, ...options })
    }

    public abstract override execute(command: CommandInteraction<'cached'>): Promise<any>;

    public override toString(): string {
        return `/${this.data.name}`;
    }
}
