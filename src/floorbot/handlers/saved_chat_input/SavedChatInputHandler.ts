import { SavedChatInputCommandData, SavedChatInputSubcommand } from './SavedChatInputCommandData.js';
import { PageableComponentID } from '../../../lib/builders/PageableButtonActionRowBuilder.js';
import { ButtonComponentID } from '../../../lib/discord/builders/ButtonActionRowBuilder.js';
import { SavedChatInputReplyBuilder } from './SavedChatInputReplyBuilder.js';
import { ButtonInteraction, ChatInputCommandInteraction } from 'discord.js';
import { BooruTable } from '../booru_handlers/tables/BooruTable.js';
import { DiscordUtil } from '../../../lib/discord/DiscordUtil.js';
import { ChatInputCommandHandler } from 'discord.js-handlers';
import { Pageable } from '../../../lib/Pageable.js';
import { Pool } from 'mariadb';

export class SavedChatInputHandler extends ChatInputCommandHandler {

    protected readonly booruTable: BooruTable;

    constructor(pool: Pool) {
        super(SavedChatInputCommandData);
        this.booruTable = new BooruTable(pool);
    }

    public async run(command: ChatInputCommandInteraction): Promise<void> {
        const subcommand = command.options.getSubcommand(true);
        switch (subcommand) {
            case SavedChatInputSubcommand.Boorus: {
                await command.deferReply();
                const user = command.options.getUser('user', false) || command.user;
                let boorus = await this.booruTable.selectBoorus(user);
                if (!Pageable.isNonEmptyArray(boorus)) {
                    const replyOptions = new SavedChatInputReplyBuilder(command)
                        .addNoSavedBoorusEmbed(user);
                    await command.followUp(replyOptions);
                } else {
                    let pageable = new Pageable(boorus);
                    const replyOptions = new SavedChatInputReplyBuilder(command)
                        .addSavedBoorusEmbed(user, pageable)
                        .addSavedBoorusActionRow(pageable);
                    const message = await command.followUp(replyOptions);
                    const collector = DiscordUtil.createComponentCollector(command.client, message);
                    collector.on('collect', async (button: ButtonInteraction) => {

                        // Handle the buttons
                        if (button.customId === PageableComponentID.NEXT_PAGE) pageable.page++;
                        if (button.customId === PageableComponentID.PREVIOUS_PAGE) pageable.page--;
                        if (button.customId === ButtonComponentID.Remove) {
                            if (button.user.id !== user.id || !DiscordUtil.isOwner(user)) {
                                const replyOptions = new SavedChatInputReplyBuilder(button)
                                    .addOwnerEmbed()
                                    .setEphemeral(true);
                                return button.reply(replyOptions);
                            }
                            await button.deferUpdate();
                            await this.booruTable.deleteBooru(user, pageable.getPageFirst().image_url);
                        }

                        // Update the reply
                        if (!button.deferred) await button.deferUpdate(); // Deleting a booru will already defer
                        boorus = await this.booruTable.selectBoorus(user);
                        if (!Pageable.isNonEmptyArray(boorus)) {
                            const replyOptions = new SavedChatInputReplyBuilder(command)
                                .addNoSavedBoorusEmbed(user);
                            return await button.editReply(replyOptions) && undefined;
                        }
                        pageable = new Pageable(boorus, { page: pageable.currentPage });
                        const replyOptions = new SavedChatInputReplyBuilder(command)
                            .addSavedBoorusEmbed(user, pageable)
                            .addSavedBoorusActionRow(pageable);
                        return await button.editReply(replyOptions) && undefined;
                    });
                }
            }
        }
    }
}
