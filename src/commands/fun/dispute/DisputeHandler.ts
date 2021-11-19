import { ContextMenuHandler } from '../../../discord/handler/abstracts/ContextMenuHandler.js';
import { DisputeCommandData } from './DisputeCommandData.js';
import { HandlerReply } from '../../../helpers/HandlerReply.js';
import { HandlerClient } from '../../../discord/handler/HandlerClient.js';
import { HandlerUtil } from '../../../discord/handler/HandlerUtil.js';
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
        const replyOptions = this.createCurrentResponse(contextMenu, origMessage, disputeResults!);
        const message = await contextMenu.followUp(replyOptions) as Message;
        const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 1 });
        collector.on('collect', this.createCollectorFunction(contextMenu, origMessage));
        collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
        // collector.on('end', (contextMenu, origMessage) => this.onCollectEnd(contextMenu, origMessage));
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
                            const replyOptions = this.createCurrentResponse(contextMenu, message, disputeResults!);
                            await component.editReply(replyOptions);
                            break;
                        }
                        case DisputeButtonID.NO: {
                            const currVote = await this.database.getDisputeVote(component, message);
                            if (!currVote) await this.database.setDisputeVote(contextMenu, component, message, false);
                            await component.deferUpdate();
                            const disputeResults = await this.database.fetchResults(message);
                            const replyOptions = this.createCurrentResponse(contextMenu, message, disputeResults!);
                            await component.editReply(replyOptions);
                            break;
                        }
                    }
                }
            } catch { }
        }
    }

    private createCurrentResponse(interaction: Interaction, message: Message, results: DisputeResults): InteractionReplyOptions {
        const embed = DisputeEmbed.getCurrentEmbed(interaction, message, results);
        const actionRow: MessageActionRow = new MessageActionRow().addComponents([
            DisputeButton.createDisputeButton(DisputeButtonID.YES),
            DisputeButton.createDisputeButton(DisputeButtonID.NO)
        ]);
        return { embeds: [embed], components: [actionRow] };
    }

    // private createFinalResponse(interaction: Interaction, message: Message, results: DisputeResults): InteractionReplyOptions {
    //
    //     return ;
    // }

    // private async onCollectEnd(contextMenu: ContextMenuInteraction, message: Message) {
    //   // await contextMenu.deferUpdate();
    //   const disputeResults = await this.database.fetchResults(message);
    //   const embed = DisputeEmbed.getFinalEmbed(contextMenu, message, disputeResults!);
    //   const replyOptions = { embeds: [embed] };
    //   await message.edit(replyOptions);
    // }

    public override async setup(client: HandlerClient): Promise<any> {
        return super.setup(client).then(() => this.database.createTables()).then(() => true);
    }
}
