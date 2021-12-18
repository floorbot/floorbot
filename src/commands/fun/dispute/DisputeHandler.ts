import { ContextMenuInteraction, Message, MessageActionRow, Interaction, InteractionReplyOptions, MessageComponentInteraction, Collection } from 'discord.js';
import { ContextMenuHandler } from '../../../lib/discord/handlers/abstracts/ContextMenuHandler.js';
import { DisputeButton, DisputeButtonID } from './components/DisputeButton.js';
import { HandlerClient } from '../../../lib/discord/HandlerClient.js';
import { HandlerUtil } from '../../../lib/discord/HandlerUtil.js';
import { DisputeDatabase, DisputeResults } from './DisputeDatabase.js';
import { HandlerReplies } from '../../../lib/discord/helpers/HandlerReplies.js';
import { DisputeCommandData } from './DisputeCommandData.js';
import { DisputeEmbed } from './components/DisputeEmbed.js';
import { HandlerDB } from '../../../lib/discord/helpers/HandlerDatabase.js';

interface voteStrings {
    readonly yes_array: string[],
    readonly no_array: string[];
}
export class DisputeHandler extends ContextMenuHandler {

    private readonly database: DisputeDatabase;
    private readonly endDelay: number = 1000 * 60 * 1;

    constructor(db: HandlerDB) {
        super({ group: 'Fun', global: false, nsfw: false, data: DisputeCommandData });
        this.database = new DisputeDatabase(db);
    }

    public async execute(contextMenu: ContextMenuInteraction): Promise<any> {
        const origMessage = contextMenu.options.getMessage('message', true) as Message;
        if (!origMessage.content.length) return contextMenu.reply(HandlerReplies.createMessageContentReply(contextMenu, 'dispute'));
        if (origMessage.author == contextMenu.user) return contextMenu.reply(DisputeEmbed.getSelfUsedEmbed(contextMenu));
        let disputeResults = await this.database.fetchResults(origMessage);
        if (disputeResults?.total_votes || 0 > 0) return contextMenu.reply(DisputeEmbed.getAlreadyDisputedEmbed(contextMenu, disputeResults!));
        await this.database.setDisputeVote(contextMenu, contextMenu.user, origMessage, true);
        await contextMenu.deferReply();
        disputeResults = await this.database.fetchResults(origMessage);
        const votes = await this.createVoteStrings(origMessage);
        const replyOptions = this.createCurrentResponse(contextMenu, origMessage, disputeResults!, votes);
        const message = await contextMenu.followUp(replyOptions) as Message;
        const collector = message.createMessageComponentCollector({ idle: this.endDelay });
        collector.on('collect', this.createCollectorFunction(contextMenu, origMessage));
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

    private createCollectorFunction(contextMenu: ContextMenuInteraction, message: Message): (component: MessageComponentInteraction) => void {
        return async (component: MessageComponentInteraction) => {
            try {
                if (component.isButton()) {
                    switch (component.customId) {
                        case DisputeButtonID.YES: {
                            const currVote = await this.database.getDisputeVote(component, message);
                            if (!currVote) await this.database.setDisputeVote(contextMenu, component.user, message, true);
                            await component.deferUpdate();
                            const disputeResults = await this.database.fetchResults(message);
                            const votes = await this.createVoteStrings(message);
                            const newTargetTimestamp = component.createdTimestamp + this.endDelay;
                            const replyOptions = this.createCurrentResponse(contextMenu, message, disputeResults!, votes, newTargetTimestamp);
                            await component.editReply(replyOptions);
                            break;
                        }
                        case DisputeButtonID.NO: {
                            const currVote = await this.database.getDisputeVote(component, message);
                            if (!currVote) await this.database.setDisputeVote(contextMenu, component.user, message, false);
                            await component.deferUpdate();
                            const disputeResults = await this.database.fetchResults(message);
                            const votes = await this.createVoteStrings(message);
                            const newTargetTimestamp = component.createdTimestamp + this.endDelay;
                            const replyOptions = this.createCurrentResponse(contextMenu, message, disputeResults!, votes, newTargetTimestamp);
                            await component.editReply(replyOptions);
                            break;
                        }
                    }
                }
            } catch { }
        };
    }

    private createCurrentResponse(interaction: Interaction, message: Message, results: DisputeResults, votes: voteStrings, targetTimestamp: number = 0): InteractionReplyOptions {
        const { yes_array, no_array } = votes;
        const embed = DisputeEmbed.getCurrentEmbed(interaction, message, results, yes_array.join('\n'), no_array.join('\n'), targetTimestamp);
        const actionRow: MessageActionRow = new MessageActionRow().addComponents([
            DisputeButton.createDisputeButton(DisputeButtonID.YES),
            DisputeButton.createDisputeButton(DisputeButtonID.NO)
        ]);
        return { embeds: [embed], components: [actionRow] };
    }

    private async onCollectEnd(contextMenu: ContextMenuInteraction, message: Message, origMessage: Message, collection: Collection<string, MessageComponentInteraction>) {
        const updatedMessage = await message.fetch();
        let disputeResults = await this.database.fetchResults(origMessage);
        let tieReplyOptions = {};
        if (disputeResults!.total_votes <= 1) {
            contextMenu.editReply(DisputeEmbed.getNotEnoughVotesEmbed(contextMenu));
            await this.database.deleteResults(origMessage);
        } else {
            if (disputeResults!.yes_votes == disputeResults!.no_votes) {
                const random_boolean = Math.random() < 0.5;
                await this.database.setDisputeVote(contextMenu, contextMenu.client.user!, origMessage, random_boolean);
                disputeResults = await this.database.fetchResults(origMessage);
                const votes = await this.createVoteStrings(message);
                tieReplyOptions = this.createCurrentResponse(contextMenu, origMessage, disputeResults!, votes);
                await contextMenu.editReply(tieReplyOptions);
            }
            const embed = DisputeEmbed.getFinalEmbed(contextMenu, origMessage, disputeResults!);
            const newMessage = { embeds: [embed] };

            HandlerUtil.deleteComponentsOnEnd(updatedMessage)(new Collection(), '');
            await collection.last()!.followUp(newMessage);
        }
    }

    public override async setup(client: HandlerClient): Promise<any> {
        return super.setup(client).then(() => this.database.createTables()).then(() => true);
    }
}
