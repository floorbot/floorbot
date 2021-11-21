import { ContextMenuInteraction, Message, MessageActionRow, Interaction, InteractionReplyOptions, MessageComponentInteraction, Collection } from 'discord.js';
import { ContextMenuHandler } from '../../../discord/handler/abstracts/ContextMenuHandler.js';
import { DisputeCommandData } from './DisputeCommandData.js';
import { HandlerReply } from '../../../helpers/HandlerReply.js';
import { HandlerClient } from '../../../discord/handler/HandlerClient.js';
import { HandlerUtil } from '../../../discord/handler/HandlerUtil.js';
import { DisputeButton, DisputeButtonID } from './components/DisputeButton.js';
import { DisputeEmbed } from './components/DisputeEmbed.js';
import { DisputeDatabase, DisputeResults } from './DisputeDatabase.js'
import { Pool } from 'mariadb';

export class DisputeHandler extends ContextMenuHandler {

    private readonly database: DisputeDatabase;
    private readonly endDelay:number = 1000 * 60 * 1;

    constructor(pool: Pool) {
        super({ group: 'Fun', global: false, nsfw: false, data: DisputeCommandData });
        this.database = new DisputeDatabase(pool);
    }

    public async execute(contextMenu: ContextMenuInteraction): Promise<any> {
        const origMessage = contextMenu.options.getMessage('message', true) as Message;
        if (!origMessage.content.length) return contextMenu.reply(HandlerReply.createMessageContentReply(contextMenu, 'dispute'));
        if (origMessage.author == contextMenu.user) return contextMenu.reply(DisputeEmbed.getSelfUsedEmbed(contextMenu));
        const disputeExists = await this.database.disputeExists(origMessage);
        const disputeResultsErr = await this.database.fetchResults(origMessage);
        if (disputeExists) return contextMenu.reply(DisputeEmbed.getAlreadyDisputedEmbed(contextMenu, disputeResultsErr!))
        await this.database.setDisputeVote(contextMenu, contextMenu, origMessage, true);
        await contextMenu.deferReply();
        const disputeResults = await this.database.fetchResults(origMessage);
        const yes_string = await this.database.getVoters(origMessage, 'yes');
        const no_string = await this.database.getVoters(origMessage, 'no');
        const replyOptions = this.createCurrentResponse(contextMenu, origMessage, disputeResults!, yes_string!, no_string!);
        const message = await contextMenu.followUp(replyOptions) as Message;
        const collector = message.createMessageComponentCollector({ idle: this.endDelay });
        collector.on('collect', this.createCollectorFunction(contextMenu, origMessage));
        collector.on('end', (collection: Collection<string, MessageComponentInteraction>) => { this.onCollectEnd(contextMenu, message, origMessage, collection); });
    }

    private createCollectorFunction(contextMenu: ContextMenuInteraction, message: Message): (component: MessageComponentInteraction) => void {
        return async (component: MessageComponentInteraction) => {
            try {
                if (component.isButton()) {
                    switch (component.customId) {
                        case DisputeButtonID.YES: {
                            const currVote = await this.database.getDisputeVote(component, message);
                            if (!currVote) await this.database.setDisputeVote(contextMenu, component, message, true);
                            await component.deferUpdate();
                            const disputeResults = await this.database.fetchResults(message);
                            const yes_string = await this.database.getVoters(message, 'yes');
                            const no_string = await this.database.getVoters(message, 'no');
                            const newTargetTimestamp = component.createdTimestamp + this.endDelay;
                            const replyOptions = this.createCurrentResponse(contextMenu, message, disputeResults!, yes_string!, no_string!, newTargetTimestamp);
                            await component.editReply(replyOptions);
                            break;
                        }
                        case DisputeButtonID.NO: {
                            const currVote = await this.database.getDisputeVote(component, message);
                            if (!currVote) await this.database.setDisputeVote(contextMenu, component, message, false);
                            await component.deferUpdate();
                            const disputeResults = await this.database.fetchResults(message);
                            const yes_string = await this.database.getVoters(message, 'yes');
                            const no_string = await this.database.getVoters(message, 'no');
                            const newTargetTimestamp = component.createdTimestamp + this.endDelay;
                            const replyOptions = this.createCurrentResponse(contextMenu, message, disputeResults!, yes_string!, no_string!, newTargetTimestamp);
                            await component.editReply(replyOptions);
                            break;
                        }
                    }
                }
            } catch { }
        }
    }

    private createCurrentResponse(interaction: Interaction, message: Message, results: DisputeResults, yes_string: string, no_string: string, targetTimestamp: number=0): InteractionReplyOptions {
        const embed = DisputeEmbed.getCurrentEmbed(interaction, message, results, yes_string, no_string, targetTimestamp);
        const actionRow: MessageActionRow = new MessageActionRow().addComponents([
            DisputeButton.createDisputeButton(DisputeButtonID.YES),
            DisputeButton.createDisputeButton(DisputeButtonID.NO)
        ]);
        return { embeds: [embed], components: [actionRow] };
    }

    private async onCollectEnd(contextMenu: ContextMenuInteraction, message: Message, origMessage: Message, collection: Collection<string, MessageComponentInteraction>) {
        const updatedMessage = await message.fetch();
        let disputeResults = await this.database.fetchResults(origMessage);
        let tieReplyOptions = {}
        if (disputeResults!.total_votes <= 1) {
            contextMenu.editReply(DisputeEmbed.getNotEnoughVotesEmbed(contextMenu));
            await this.database.deleteResults(origMessage);
        } else {
            if (disputeResults!.yes_votes == disputeResults!.no_votes) {
                const random_boolean = Math.random() < 0.5;
                await this.database.setDisputeVoteID(contextMenu, contextMenu.client.user!, origMessage, random_boolean);
                disputeResults = await this.database.fetchResults(origMessage);

                const yes_string = await this.database.getVoters(origMessage, 'yes');
                const no_string = await this.database.getVoters(origMessage, 'no');
                tieReplyOptions = this.createCurrentResponse(contextMenu, origMessage, disputeResults!, yes_string!, no_string!);
                await contextMenu.editReply(tieReplyOptions);
            }
            const embed = DisputeEmbed.getFinalEmbed(contextMenu, origMessage, disputeResults!);
            const newMessage = { embeds: [embed] };

            HandlerUtil.deleteComponentsOnEnd(updatedMessage)();
            await collection.last()!.followUp(newMessage);
        }
    }

    public override async setup(client: HandlerClient): Promise<any> {
        return super.setup(client).then(() => this.database.createTables()).then(() => true);
    }
}
