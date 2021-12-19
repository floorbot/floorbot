import { ContextMenuInteraction, Message, MessageComponentInteraction, Collection } from 'discord.js';
import { ContextMenuHandler } from '../../../lib/discord/handlers/abstracts/ContextMenuHandler.js';
import { ComponentID } from '../../../lib/discord/builders/ActionRowBuilder.js';
import { HandlerDB } from '../../../lib/discord/helpers/HandlerDatabase.js';
import { HandlerClient } from '../../../lib/discord/HandlerClient.js';
import { HandlerUtil } from '../../../lib/discord/HandlerUtil.js';
import { DisputeReplyBuilder } from './DisputeReplyBuilder.js';
import { DisputeCommandData } from './DisputeCommandData.js';
import { DisputeDatabase } from './DisputeDatabase.js';

export interface voteStrings {
    readonly yes_array: string[],
    readonly no_array: string[];
}
export class DisputeHandler extends ContextMenuHandler {

    private readonly database: DisputeDatabase;
    public static readonly END_DELAY: number = 1000 * 60 * 1;
    private timeStamp = 0;

    constructor(db: HandlerDB) {
        super({ group: 'Fun', global: false, nsfw: false, data: DisputeCommandData });
        this.database = new DisputeDatabase(db);
    }

    public async execute(contextMenu: ContextMenuInteraction): Promise<any> {
        const origMessage = contextMenu.options.getMessage('message', true) as Message;
        if (!origMessage.content.length) return contextMenu.reply(new DisputeReplyBuilder(contextMenu).addMissingContentReply('dispute'));
        if (origMessage.author == contextMenu.user) return contextMenu.reply(new DisputeReplyBuilder(contextMenu).addDisputeSelfUsedEmbed());
        let disputeResults = await this.database.fetchResults(origMessage);
        if (disputeResults?.total_votes || 0 > 0) return contextMenu.reply(new DisputeReplyBuilder(contextMenu).addDisputeAlreadyDisputedEmbed(disputeResults!));
        await this.database.setDisputeVote(contextMenu, contextMenu.user, origMessage, true);
        await contextMenu.deferReply();
        disputeResults = await this.database.fetchResults(origMessage);
        this.timeStamp = Math.round((contextMenu.createdTimestamp + DisputeHandler.END_DELAY));
        const votes = await this.createVoteStrings(origMessage);
        const embed = new DisputeReplyBuilder(contextMenu)
            .addDisputeEmbed(origMessage, disputeResults!, votes)
            .addDisputeActionRow();
        const message = await contextMenu.followUp(embed) as Message;
        const collector = message.createMessageComponentCollector({ time: DisputeHandler.END_DELAY });
        collector.on('collect', this.createCollectorFunction(contextMenu, origMessage, collector));
        collector.on('end', (collection: Collection<string, MessageComponentInteraction>) => { this.onCollectEnd(contextMenu, message, origMessage, collection); });
    }

    private async createVoteStrings(message: Message): Promise<voteStrings> {
        const votes = await this.database.getVoters(message);
        const yes_array: string[] = [];
        const no_array: string[] = [];
        if (!votes) return { yes_array, no_array };
        votes.forEach(function (obj) { obj.vote_choice ? yes_array.push(`<@${obj.vote_user_id}>`) : no_array.push(`<@${obj.vote_user_id}>`); });
        return { yes_array, no_array };
    }

    private createCollectorFunction(contextMenu: ContextMenuInteraction, message: Message, collector: any): (component: MessageComponentInteraction) => void {
        return async (component: MessageComponentInteraction) => {
            try {
                if (component.isButton()) {
                    switch (component.customId) {
                        case ComponentID.YES: {
                            const currVote = await this.database.getDisputeVote(component, message);
                            if (!currVote) {
                                collector.resetTimer();
                                this.timeStamp = component.createdTimestamp + DisputeHandler.END_DELAY;
                            }
                            await this.database.setDisputeVote(contextMenu, component.user, message, true);
                            await component.deferUpdate();
                            const disputeResults = await this.database.fetchResults(message);
                            const votes = await this.createVoteStrings(message);
                            const embed = new DisputeReplyBuilder(contextMenu)
                                .addDisputeEmbed(message, disputeResults!, votes, this.timeStamp)
                                .addDisputeActionRow();
                            await component.editReply(embed);
                            break;
                        }
                        case ComponentID.NO: {
                            const currVote = await this.database.getDisputeVote(component, message);
                            if (!currVote) {
                                collector.resetTimer();
                                this.timeStamp = component.createdTimestamp + DisputeHandler.END_DELAY;
                            }
                            await this.database.setDisputeVote(contextMenu, component.user, message, false);
                            await component.deferUpdate();
                            const disputeResults = await this.database.fetchResults(message);
                            const votes = await this.createVoteStrings(message);
                            const embed = new DisputeReplyBuilder(contextMenu)
                                .addDisputeEmbed(message, disputeResults!, votes, this.timeStamp)
                                .addDisputeActionRow();
                            await component.editReply(embed);
                            break;
                        }
                    }
                }
            } catch { }
        };
    }

    private async onCollectEnd(contextMenu: ContextMenuInteraction, message: Message, origMessage: Message, collection: Collection<string, MessageComponentInteraction>) {
        const updatedMessage = await message.fetch();
        HandlerUtil.deleteComponentsOnEnd(updatedMessage)(new Collection(), '');
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
                    .addDisputeEmbed(origMessage, disputeResults!, votes)
                    .addDisputeActionRow();
                await contextMenu.editReply(embed);
            }
            const embed = new DisputeReplyBuilder(contextMenu).addDisputeFinalEmbed(origMessage, disputeResults!);
            await collection.last()!.followUp(embed);
        }
    }

    public override async setup(client: HandlerClient): Promise<any> {
        return super.setup(client).then(() => this.database.createTables()).then(() => true);
    }
}
