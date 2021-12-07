import { BooruEmbedFactory, BooruEmbedFactoryOptions } from "../embeds/BooruEmbedFactory";
import { BooruImageData, BooruSuggestionData } from "../interfaces/BooruInterfaces";
import { BooruSelectMenuFactory } from "../select-menus/BooruSelectMenuFactory";
import { BooruButtonFactory } from "../buttons/BooruButtonFactory";
import { Constants, InteractionReplyOptions } from "discord.js";
import { Context, ReplyFactory } from "../ReplyFactory";

const { MessageComponentTypes } = Constants;

export type BooruReplyOptions = BooruEmbedFactoryOptions;

export class BooruReplyFactory extends ReplyFactory {

    public readonly selectMenuFactory: BooruSelectMenuFactory;
    public readonly buttonFactory: BooruButtonFactory;
    public readonly embedFactory: BooruEmbedFactory;

    constructor(context: Context, options: BooruReplyOptions) {
        super(context);
        this.buttonFactory = new BooruButtonFactory();
        this.selectMenuFactory = new BooruSelectMenuFactory();
        this.embedFactory = new BooruEmbedFactory(context, options);
    }

    public createSuggestionReply(data: BooruSuggestionData): InteractionReplyOptions {
        const embed = this.embedFactory.createSuggestionEmbed(data);
        if (!data.suggestions.length) return { embeds: [embed] };
        const selectMenu = this.selectMenuFactory.createSuggestionSelectMenu(data);
        return { embeds: [embed], components: [selectMenu.toActionRow()] };
    }

    public createImageReply(data: BooruImageData): InteractionReplyOptions {
        const embed = this.embedFactory.createImageEmbed(data);
        const viewOnlineButton = this.buttonFactory.createViewOnlineButton(data.postURL);
        const recycleButton = this.buttonFactory.createRecycleButton();
        const repeatButton = this.buttonFactory.createRepeatButton();

        return {
            embeds: [embed],
            components: [{
                type: MessageComponentTypes.ACTION_ROW,
                components: [
                    viewOnlineButton,
                    repeatButton,
                    recycleButton
                ]
            }]
        };
    }
}