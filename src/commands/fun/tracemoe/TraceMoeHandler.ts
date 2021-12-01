import { ContextMenuInteraction, Message, MessageActionRow, Interaction, InteractionReplyOptions, MessageComponentInteraction, Collection } from 'discord.js';
import { ContextMenuHandler } from '../../../discord/handlers/abstracts/ContextMenuHandler.js';
import { HandlerClient } from '../../../discord/HandlerClient.js';
import { HandlerUtil } from '../../../discord/HandlerUtil.js';
import { HandlerReplies } from '../../../discord/helpers/HandlerReplies.js';
import { TraceMoeCommandData } from './DisputeCommandData.js';
import { DisputeEmbed } from './components/DisputeEmbed.js';

export class TraceMoeHandler extends ContextMenuHandler {

    public async execute(contextMenu: ContextMenuInteraction): Promise<any> {
        const origMessage = contextMenu.options.getMessage('message', true) as Message;
        if (!origMessage.content.length) return contextMenu.reply(HandlerReplies.createMessageContentReply(contextMenu, 'dispute'));
        if (origMessage.author == contextMenu.user) return contextMenu.reply(DisputeEmbed.getSelfUsedEmbed(contextMenu));
        if (disputeExists) return contextMenu.reply(DisputeEmbed.getAlreadyDisputedEmbed(contextMenu, disputeResultsErr!))
        await contextMenu.deferReply();
        const replyOptions = this.createCurrentResponse(contextMenu, origMessage);
        const message = await contextMenu.followUp(replyOptions) as Message;
    }

    private createCurrentResponse(interaction: Interaction, message: Message, results: DisputeResults, yes_string: string, no_string: string, targetTimestamp: number = 0): InteractionReplyOptions {
        const embed = DisputeEmbed.getCurrentEmbed(interaction, message, results, yes_string, no_string, targetTimestamp);
        const actionRow: MessageActionRow = new MessageActionRow().addComponents([
            DisputeButton.createDisputeButton(DisputeButtonID.YES),
            DisputeButton.createDisputeButton(DisputeButtonID.NO)
        ]);
        return { embeds: [embed], components: [actionRow] };
    }
}
