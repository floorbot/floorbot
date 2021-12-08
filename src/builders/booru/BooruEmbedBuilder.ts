import { BuilderContext } from "../../discord/builders/BuilderInterfaces.js";
import { EmbedBuilder } from "../../discord/builders/EmbedBuilder.js";
import { BooruBuilderAPIData } from "./BooruBuilderInterfaces.js";

export class BooruEmbedBuilder extends EmbedBuilder {

    constructor(context: BuilderContext, data: BooruBuilderAPIData) {
        super();
        this.setContextAuthor(context);
        this.setFooter(`Powered by ${data.apiName}`, data.apiIcon);
    }
}
