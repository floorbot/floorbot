import { ContextMenuHandler } from '../../../discord/handler/abstracts/ContextMenuHandler.js';
import { DisputeCommandData } from './DisputeCommandData.js';
import { HandlerReply } from '../../../helpers/HandlerReply.js';
import { HandlerClient } from '../../../discord/handler/HandlerClient.js';
import { DisputeButton, DisputeButtonID } from './components/DisputeButton.js';
import { DisputeEmbed } from './components/DisputeEmbed.js';
import { ContextMenuInteraction, Message, MessageActionRow, Interaction, InteractionReplyOptions, MessageComponentInteraction } from 'discord.js';
import { DisputeDatabase, DisputeResults } from './DisputeDatabase.js'
import { Pool } from 'mariadb';

export class DisputeHandler extends ContextMenuHandler {

    private readonly database: DisputeDatabase;

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
        console.log(yes_string);
        const no_string = await this.database.getVoters(origMessage, 'no');
        const replyOptions = this.createCurrentResponse(contextMenu, origMessage, disputeResults!, yes_string!, no_string!);
        const message = await contextMenu.followUp(replyOptions) as Message;
        const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 1 });
        collector.on('collect', this.createCollectorFunction(contextMenu, origMessage));
        collector.on('end', () => { this.onCollectEnd(contextMenu, message, origMessage); });
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
                            const replyOptions = this.createCurrentResponse(contextMenu, message, disputeResults!, yes_string!, no_string!);
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
                            const replyOptions = this.createCurrentResponse(contextMenu, message, disputeResults!, yes_string!, no_string!);
                            await component.editReply(replyOptions);
                            break;
                        }
                    }
                }
            } catch { }
        }
    }

    private createCurrentResponse(interaction: Interaction, message: Message, results: DisputeResults, yes_string: string, no_string: string): InteractionReplyOptions {
        const embed = DisputeEmbed.getCurrentEmbed(interaction, message, results, yes_string, no_string);
        const actionRow: MessageActionRow = new MessageActionRow().addComponents([
            DisputeButton.createDisputeButton(DisputeButtonID.YES),
            DisputeButton.createDisputeButton(DisputeButtonID.NO)
        ]);
        return { embeds: [embed], components: [actionRow] };
    }

    private async onCollectEnd(contextMenu: ContextMenuInteraction, message: Message, origMessage: Message) {
        const updatedMessage = await message.fetch();
        const disputeResults = await this.database.fetchResults(origMessage);
        if (disputeResults!.total_votes <= 1) {
            contextMenu.editReply(DisputeEmbed.getNotEnoughVotesEmbed(contextMenu));
        } else {
            const embed = DisputeEmbed.getFinalEmbed(contextMenu, origMessage, disputeResults!);
            const replyOptions = { embeds: [embed], components: [] };
            await updatedMessage.edit(replyOptions);
        }
    }

    public override async setup(client: HandlerClient): Promise<any> {
        return super.setup(client).then(() => this.database.createTables()).then(() => true);
    }
}
