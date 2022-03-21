import { Collection, ContextMenuCommandInteraction, Message, MessageApplicationCommandData, MessageComponentInteraction } from 'discord.js';
import { ButtonComponentID } from '../../lib/discord/builders/ButtonActionRowBuilder.js';
import { ApplicationCommandHandler, HandlerClient } from 'discord.js-handlers';
import { DisputeMessageCommandData } from './DisputeMessageCommandData.js';
import { DisputeReplyBuilder, DisputeTimeStamp } from './DisputeMixins.js';
import { HandlerUtil } from '../../lib/discord/HandlerUtil.js';
import { DisputeTable } from './DisputeTable.js';
import { Pool } from 'mariadb';

export interface voteStrings {
    readonly yes_array: string[],
    readonly no_array: string[];
}

export class DisputeMessageHandler extends ApplicationCommandHandler<MessageApplicationCommandData> {

    private readonly database: DisputeTable;
    public static readonly END_DELAY: number = 1000 * 60 * 1;

    constructor(pool: Pool) {
        super(DisputeMessageCommandData);
        this.database = new DisputeTable(pool);
    }

    public async run(contextMenu: ContextMenuCommandInteraction<'cached'>): Promise<any> {
        const timestamp = new DisputeTimeStamp(contextMenu.createdTimestamp + DisputeMessageHandler.END_DELAY);
        const origMessage = contextMenu.options.getMessage('message', true);
        if (!origMessage.content.length) return contextMenu.reply(new DisputeReplyBuilder(contextMenu).addMissingContentEmbed('dispute'));
        if (origMessage.author == contextMenu.user) return contextMenu.reply(new DisputeReplyBuilder(contextMenu).addDisputeSelfUsedEmbed());
        let disputeResults = await this.database.fetchResults(origMessage);
        if (disputeResults?.total_votes || 0 > 0) return contextMenu.reply(new DisputeReplyBuilder(contextMenu).addDisputeAlreadyDisputedEmbed(disputeResults!));
        await this.database.setDisputeVote(contextMenu, contextMenu.user, origMessage, true);
        await contextMenu.deferReply();
        disputeResults = await this.database.fetchResults(origMessage);
        const votes = await this.createVoteStrings(origMessage);
        const embed = new DisputeReplyBuilder(contextMenu)
            .addDisputeEmbed(origMessage, disputeResults!, votes, timestamp.getTimestamp())
            .addDisputeActionRow();
        const message = await contextMenu.followUp(embed) as Message;
        const collector = message.createMessageComponentCollector({ time: DisputeMessageHandler.END_DELAY });
        collector.on('collect', this.createCollectorFunction(contextMenu, origMessage, collector, timestamp));
        collector.on('end', (collection: Collection<string, MessageComponentInteraction>) => { this.onCollectEnd(contextMenu, message, origMessage, collection, timestamp); });
    }

    private async createVoteStrings(message: Message): Promise<voteStrings> {
        const votes = await this.database.getVoters(message);
        const yes_array: string[] = [];
        const no_array: string[] = [];
        if (!votes) return { yes_array, no_array };
        votes.forEach(function (obj) { obj.vote_choice ? yes_array.push(`<@${obj.vote_user_id}>`) : no_array.push(`<@${obj.vote_user_id}>`); });
        return { yes_array, no_array };
    }

    private createCollectorFunction(contextMenu: ContextMenuCommandInteraction, message: Message, collector: any, timestamp: DisputeTimeStamp): (component: MessageComponentInteraction) => void {
        return async (component: MessageComponentInteraction) => {
            try {
                if (component.isButton()) {
                    switch (component.customId) {
                        case ButtonComponentID.Yes: {
                            const currVote = await this.database.getDisputeVote(component, message);
                            if (!currVote) {
                                collector.resetTimer();
                                timestamp.setTimestamp(component.createdTimestamp + DisputeMessageHandler.END_DELAY);
                            }
                            await this.database.setDisputeVote(contextMenu, component.user, message, true);
                            await component.deferUpdate();
                            const disputeResults = await this.database.fetchResults(message);
                            const votes = await this.createVoteStrings(message);
                            const embed = new DisputeReplyBuilder(contextMenu)
                                .addDisputeEmbed(message, disputeResults!, votes, timestamp.getTimestamp())
                                .addDisputeActionRow();
                            await component.editReply(embed);
                            break;
                        }
                        case ButtonComponentID.No: {
                            const currVote = await this.database.getDisputeVote(component, message);
                            if (!currVote) {
                                collector.resetTimer();
                                timestamp.setTimestamp(component.createdTimestamp + DisputeMessageHandler.END_DELAY);
                            }
                            await this.database.setDisputeVote(contextMenu, component.user, message, false);
                            await component.deferUpdate();
                            const disputeResults = await this.database.fetchResults(message);
                            const votes = await this.createVoteStrings(message);
                            const embed = new DisputeReplyBuilder(contextMenu)
                                .addDisputeEmbed(message, disputeResults!, votes, timestamp.getTimestamp())
                                .addDisputeActionRow();
                            await component.editReply(embed);
                            break;
                        }
                    }
                }
            } catch { }
        };
    }

    private async onCollectEnd(contextMenu: ContextMenuCommandInteraction, message: Message, origMessage: Message, collection: Collection<string, MessageComponentInteraction>, timestamp: DisputeTimeStamp) {
        const updatedMessage = await message.fetch();
        await HandlerUtil.deleteComponentsOnEnd(updatedMessage)(new Collection(), '');
        let disputeResults = await this.database.fetchResults(origMessage);
        if (disputeResults!.total_votes <= 1) {
            contextMenu.editReply(new DisputeReplyBuilder(contextMenu).addDisputeNotEnoughVotesEmbed());
            await this.database.deleteResults(origMessage);
        } else {
            if (disputeResults!.yes_votes == disputeResults!.no_votes) {
                const random_boolean = Math.random() < 0.5;
                await this.database.setDisputeVote(contextMenu, contextMenu.client.user!, origMessage, random_boolean);
                disputeResults = await this.database.fetchResults(origMessage);
                const votes = await this.createVoteStrings(origMessage);
                const embed = new DisputeReplyBuilder(contextMenu)
                    .addDisputeEmbed(origMessage, disputeResults!, votes, timestamp.getTimestamp());
                await contextMenu.editReply(embed);
            }
            const embed = new DisputeReplyBuilder(contextMenu).addDisputeFinalEmbed(origMessage, disputeResults!);
            await collection.last()!.followUp(embed);
        }
    }

    public override async setup(client: HandlerClient): Promise<any> {
        return super.setup(client).then(() => this.database.createTable()).then(() => true);
    }
}
