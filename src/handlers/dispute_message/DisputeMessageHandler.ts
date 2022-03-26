import { ButtonComponentID } from '../../lib/discord/builders/ButtonActionRowBuilder.js';
import { ComponentCollectorEndHandler } from '../../lib/discord/ComponentCollector.js';
import { HandlerClient, MessageContextMenuCommandHandler } from 'discord.js-handlers';
import { ButtonInteraction, MessageContextMenuCommandInteraction } from 'discord.js';
import { DisputeMessageCommandData } from './DisputeMessageCommandData.js';
import { DisputeVoteTable } from './tables/DisputeVoteTable.js';
import { DisputeReplyBuilder } from './DisputeReplyBuilder.js';
import { DiscordUtil } from '../../lib/discord/DiscordUtil.js';
import { DisputeTable } from './tables/DisputeTable.js';
import { Pool } from 'mariadb';

export interface voteStrings {
    readonly yes_array: string[],
    readonly no_array: string[];
}

export class DisputeMessageHandler extends MessageContextMenuCommandHandler {

    private readonly disputeTable: DisputeTable;
    private readonly disputeVoteTable: DisputeVoteTable;
    public static readonly TIME_DELAY: number = 1000 * 60 * 1;

    constructor(pool: Pool) {
        super(DisputeMessageCommandData);
        this.disputeTable = new DisputeTable(pool);
        this.disputeVoteTable = new DisputeVoteTable(pool);
    }

    public async run(contextMenu: MessageContextMenuCommandInteraction): Promise<void> {
        const disputedMessage = contextMenu.targetMessage;

        // Empty message
        if (!disputedMessage.content) {
            const replyOptions = new DisputeReplyBuilder(contextMenu).addMissingContentEmbed('dispute').setEphemeral();
            return await contextMenu.reply(replyOptions);
        }

        // Self dispute
        if (disputedMessage.author.id === contextMenu.user.id) {
            const replyOptions = new DisputeReplyBuilder(contextMenu).addDisputeSelfEmbed().setEphemeral();
            return await contextMenu.reply(replyOptions);
        }

        await contextMenu.deferReply();
        let existingDispute = await this.disputeTable.selectDispute(disputedMessage);
        let disputeVotes = await this.disputeVoteTable.selectDisputeVotes(disputedMessage);
        if (existingDispute) {
            const replyOptions = new DisputeReplyBuilder(contextMenu)
                .addDisputeEmbed(existingDispute, disputeVotes);
            return await contextMenu.followUp(replyOptions) && undefined;
        }

        const dispute = await this.disputeTable.insertDispute(contextMenu);
        const replyOptions = new DisputeReplyBuilder(contextMenu)
            .addDisputeEmbed(dispute, disputeVotes, contextMenu.createdTimestamp + DisputeMessageHandler.TIME_DELAY)
            .addDisputeActionRow(disputedMessage);
        const message = await contextMenu.followUp(replyOptions);
        const collector = DiscordUtil.createComponentCollector(contextMenu.client, message, { time: DisputeMessageHandler.TIME_DELAY, endHandler: ComponentCollectorEndHandler.None });
        collector.on('collect', async (button: ButtonInteraction) => {
            await button.deferUpdate();
            if (!disputeVotes.some(vote => vote.user_id === button.user.id)) collector.resetTimer();
            if (button.customId === ButtonComponentID.Disagree) await this.disputeVoteTable.insertDisputeVote(contextMenu, button);
            if (button.customId === ButtonComponentID.Agree) await this.disputeVoteTable.insertDisputeVote(contextMenu, button);
            disputeVotes = await this.disputeVoteTable.selectDisputeVotes(disputedMessage);
            const replyOptions = new DisputeReplyBuilder(contextMenu)
                .addDisputeEmbed(dispute, disputeVotes, button.createdTimestamp + (collector.options.time ?? DisputeMessageHandler.TIME_DELAY))
                .addDisputeActionRow(disputedMessage);
            await contextMenu.editReply(replyOptions);
        });
        collector.on('end', async collection => {
            const lastInteraction = collection.last() ?? contextMenu;
            disputeVotes = await this.disputeVoteTable.selectDisputeVotes(disputedMessage);

            // Handle tie breakers
            if (!(disputeVotes.length % 2)) {
                const [first, second] = await this.disputeVoteTable.selectDisputeVoteCount(disputedMessage);
                if (first && second && first.count === second.count) {
                    const vote = Math.random() < 0.5 ? ButtonComponentID.Agree : ButtonComponentID.Disagree;
                    await this.disputeVoteTable.insertDisputeVote(contextMenu, contextMenu.client.user!, vote);
                    disputeVotes = await this.disputeVoteTable.selectDisputeVotes(disputedMessage);
                }
            }

            const replyOptions = new DisputeReplyBuilder(contextMenu)
                .addDisputeEmbed(dispute, disputeVotes)
                .addDisputeActionRow(disputedMessage)
                .clearComponents();

            // Handle not enough voters
            if (disputeVotes.length < 2) {
                await this.disputeVoteTable.deleteDisputeVote(disputedMessage);
                await this.disputeTable.deleteDispute(disputedMessage);
                replyOptions.addDisputeFailedEmbed();
            }
            await lastInteraction.editReply(replyOptions);
        });
    }

    public override async setup(client: HandlerClient): Promise<void> {
        return super.setup(client).then(async () => {
            await this.disputeTable.createTable();
            await this.disputeVoteTable.createTable();
        });
    }
}
