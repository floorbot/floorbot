import { Message, MessageContextMenuCommandInteraction } from 'discord.js';
import { MariaDBTable } from "../../../lib/MariaDBTable.js";
import { APIMessage } from 'discord-api-types/v10';
import { Pool } from "mariadb";
import path from 'path';
import fs from 'fs';

export type DisputeRowPK = Pick<DisputeRow, 'message_id' | 'channel_id'>;
export interface DisputeRow {
    readonly message_id: string;
    readonly channel_id: string;
    readonly guild_id: string | null;
    readonly disputer_id: string;
    readonly disputee_id: string;
    readonly content: string;
    readonly epoch: number;
}

export class DisputeTable extends MariaDBTable<DisputeRow, DisputeRowPK> {

    constructor(pool: Pool) {
        super(pool, 'dispute');
    }

    public async selectDispute(message: APIMessage | Message): Promise<DisputeRow | null> {
        const rows = await this.select({
            channel_id: message instanceof Message ? message.channelId : message.channel_id,
            message_id: message.id
        });
        return rows[0] ?? null;
    }

    public async insertDispute(contextMenu: MessageContextMenuCommandInteraction): Promise<DisputeRow> {
        const row = {
            message_id: contextMenu.targetMessage.id,
            channel_id: contextMenu.channelId,
            guild_id: contextMenu.guildId,
            disputer_id: contextMenu.user.id,
            disputee_id: contextMenu.targetMessage.author.id,
            content: contextMenu.targetMessage.content,
            epoch: contextMenu.createdTimestamp
        };
        await super.insert(row);
        return row;
    }

    public deleteDispute(message: APIMessage | Message): Promise<void> {
        return super.delete({
            message_id: message.id,
            channel_id: message instanceof Message ? message.channelId : message.channel_id
        });
    }

    public async createTable(): Promise<void> {
        const sql = fs.readFileSync(`${path.resolve()}/res/schemas/dispute.sql`, 'utf8');
        return this.query(sql).catch(error => {
            if (error.code !== 'ER_TABLE_EXISTS_ERROR') throw error.reason;
        });
    }
}
