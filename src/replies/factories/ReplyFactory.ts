import { Interaction, Message } from "discord.js";

export type Context = Interaction | Message;

export class ReplyFactory {

    public readonly context: Context;

    constructor(context: Context) {
        this.context = context;
    }
}