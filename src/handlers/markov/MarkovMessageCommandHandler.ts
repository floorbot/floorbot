import { MessageContextMenuCommandInteraction } from 'discord.js';
import { HandlerClient, MessageContextMenuCommandHandler } from 'discord.js-handlers';
import { Pool } from 'mariadb';
import { Util } from '../../core/Util.js';
import { MarkovMessageCommandData } from './MarkovMessageCommandData.js';
import { MarkovReplyBuilder } from './builders/MarkovReplyBuilder.js';
import { MarkovStateTable } from './tables/MarkovStateTable.js';

export class MarkovMessageCommandHandler extends MessageContextMenuCommandHandler {

    private readonly stateTable: MarkovStateTable;

    constructor({ pool }: { pool: Pool; }) {
        super(MarkovMessageCommandData);
        this.stateTable = new MarkovStateTable(pool);
    }

    public async run(contextMenu: MessageContextMenuCommandInteraction): Promise<any> {
        await contextMenu.deferReply({ ephemeral: true });
        if (Util.isAdminOrOwner(contextMenu) || contextMenu.targetMessage.author.id === contextMenu.user.id) {
            await this.stateTable.delete({ channel_id: contextMenu.channelId, message_id: contextMenu.targetId });
            const replyOptions = new MarkovReplyBuilder(contextMenu)
                .setEphemeral(true)
                .addEmbedMessage({ content: 'Message removed from markov database' });
            return await contextMenu.followUp(replyOptions);
        }
        const replyOptions = new MarkovReplyBuilder(contextMenu)
            .addAdminOrOwnerEmbed({ command: contextMenu })
            .setEphemeral(true);
        return await contextMenu.followUp(replyOptions);
    }

    public override async setup({ client }: { client: HandlerClient; }): Promise<any> {
        const setup = await super.setup({ client });
        await this.stateTable.createTable();
        return setup;
    }
}
