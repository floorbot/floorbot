import { BooruBuilderAPIData } from "./BooruBuilderInterfaces";
import { EmbedBuilder } from "../EmbedBuilder";
import { Context } from "../ReplyBuilder";

export class BooruEmbedBuilder extends EmbedBuilder {

    constructor(context: Context, data: BooruBuilderAPIData) {
        super();
        this.setContextAuthor(context);
        this.setFooter(`Powered by ${data.apiName}`, data.apiIcon);
    }
}