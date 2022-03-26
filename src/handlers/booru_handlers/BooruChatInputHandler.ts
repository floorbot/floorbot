import { Awaitable, ChatInputApplicationCommandData, ChatInputCommandInteraction, Interaction, MessageComponentInteraction } from 'discord.js';
import { BooruSelectMenuComponentID, BooruSuggestionData } from './builders/BooruSelectMenuActionRowBuilder.js';
import { BooruErrorData, BooruPostData, BooruReplyBuilder } from './builders/BooruReplyBuilder.js';
import { ButtonComponentID } from '../../lib/discord/builders/ButtonActionRowBuilder.js';
import { BooruButtonComponentID } from './builders/BooruButtonActionRowBuilder.js';
import { ChatInputCommandHandler, HandlerClient } from 'discord.js-handlers';
import { DiscordUtil } from '../../lib/discord/DiscordUtil.js';
import { BooruTable } from './tables/BooruTable.js';
import { Pool } from 'mariadb';

export abstract class BooruChatInputHandler extends ChatInputCommandHandler {

    protected readonly booruTable: BooruTable;

    constructor(pool: Pool, data: ChatInputApplicationCommandData) {
        super(data);
        this.booruTable = new BooruTable(pool);
    }

    public abstract fetchBooruData(_query: string | null): Promise<BooruPostData | BooruSuggestionData | BooruErrorData>;

    public getCommandQuery(command: ChatInputCommandInteraction): string {
        const tags = command.options.getString('tags');
        const thread = command.options.getString('thread');
        return (tags || thread || '').replace(/ /g, '+');
    }

    public async run(command: ChatInputCommandInteraction): Promise<void> {
        await command.deferReply();
        const query = this.getCommandQuery(command);
        const booru = await this.fetchBooruData(query);
        const replyOptions = this.createReplyOptions(command, booru);
        const message = await command.followUp(replyOptions);
        const collector = DiscordUtil.createComponentCollector(command.client, message);
        collector.on('collect', this.createCollector(command, booru));
    }

    private createCollector(source: Interaction, booru: BooruPostData | BooruSuggestionData | BooruErrorData): (interaction: MessageComponentInteraction) => Awaitable<any> {
        return async (component: MessageComponentInteraction) => {
            if (component.isSelectMenu() && BooruChatInputHandler.isBooruSuggestionData(booru)) {
                switch (component.customId) {
                    case BooruSelectMenuComponentID.Suggestions: {
                        await component.deferUpdate();
                        const query = component.values.join('+');
                        const selectedBooru = await this.fetchBooruData(query);
                        if (BooruChatInputHandler.isBooruSuggestionData(selectedBooru)) {
                            const compromisedBooru = { ...booru, query: query }; // The same booru that led to this outcome with updated (selected) tags
                            const replyOptions = this.createReplyOptions(source, compromisedBooru);
                            return component.editReply(replyOptions);
                        } else {
                            booru = selectedBooru;
                            const replyOptions = this.createReplyOptions(source, booru);
                            return component.editReply(replyOptions);
                        }
                    }
                }
            }
            if (component.isButton() && BooruChatInputHandler.isBooruPostData(booru)) {
                switch (component.customId) {
                    case BooruButtonComponentID.Recycle: {
                        if (!DiscordUtil.isAdminOrOwner(component, source)) {
                            const replyOptions = new BooruReplyBuilder(component).addAdminOrOwnerEmbed();
                            return await component.reply(replyOptions);
                        }
                        await component.deferUpdate();
                        booru = await this.fetchBooruData(booru.query);
                        const replyOptions = this.createReplyOptions(source, booru);
                        return await component.editReply(replyOptions);
                    }
                    case BooruButtonComponentID.Repeat: {
                        await component.deferReply();
                        const replyOptions = this.createReplyOptions(component, booru);
                        const message = await component.followUp(replyOptions);
                        const collector = DiscordUtil.createComponentCollector(component.client, message);
                        return collector.on('collect', this.createCollector(component, booru));
                    }
                    case BooruButtonComponentID.Tags: {
                        const replyOptions = new BooruReplyBuilder(source)
                            .addTagsEmbed(booru)
                            .addTagsActionRow(booru);
                        return await component.update(replyOptions);
                    }
                    case BooruButtonComponentID.Image: {
                        const replyOptions = new BooruReplyBuilder(source)
                            .addImageEmbed(booru)
                            .addImageActionRow(booru);
                        return await component.update(replyOptions);
                    }
                    case ButtonComponentID.Heart: {
                        await component.deferReply({ ephemeral: true });
                        await this.booruTable.insertBooru(component.user, booru);
                        const replyOptions = new BooruReplyBuilder(source)
                            .addBooruSavedEmbed(booru)
                            .setEphemeral(true);
                        component.message;
                        return await component.followUp(replyOptions);
                    }
                }
            }
        };
    }

    private createReplyOptions(source: Interaction, booru: BooruPostData | BooruSuggestionData | BooruErrorData): BooruReplyBuilder {
        if (BooruChatInputHandler.isBooruPostData(booru)) {
            return new BooruReplyBuilder(source)
                .addImageEmbed(booru)
                .addImageActionRow(booru);
        } else if (BooruChatInputHandler.isBooruSuggestionData(booru)) {
            return new BooruReplyBuilder(source)
                .addSuggestionsEmbed(booru)
                .addSuggestionsActionRow(booru);
        } else {
            return new BooruReplyBuilder(source)
                .addBooruErrorEmbed(booru)
                .clearComponents();
        }
    }

    public override async setup(client: HandlerClient): Promise<void> {
        return super.setup(client).then(() => this.booruTable.createTable());
    }

    public static isBooruPostData(booru: BooruPostData | BooruSuggestionData | BooruErrorData): booru is BooruPostData {
        return 'imageURL' in booru;
    }

    public static isBooruSuggestionData(booru: BooruPostData | BooruSuggestionData | BooruErrorData): booru is BooruSuggestionData {
        return 'suggestions' in booru;
    }

    public static isBooruErrorData(booru: BooruPostData | BooruSuggestionData | BooruErrorData): booru is BooruErrorData {
        return 'error' in booru;
    }
}
