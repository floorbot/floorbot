import { EmbedBuilder } from "../builders/EmbedBuilder";
import { Context } from "./ReplyFactory";

export class EmbedFactory {

    public readonly context: Context;

    constructor(context: Context) {
        this.context = context;
    }

    public createEmbedTemplate(): EmbedBuilder {
        return new EmbedBuilder()
            .setContextAuthor(this.context);
    }
}