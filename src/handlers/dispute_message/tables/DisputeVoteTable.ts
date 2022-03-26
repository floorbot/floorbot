import { ButtonInteraction, Message, MessageContextMenuCommandInteraction, User } from 'discord.js';
import { MariaDBTable } from "../../../lib/MariaDBTable.js";
import { APIMessage } from 'discord-api-types/v10';
import { DisputeRow } from './DisputeTable.js';
import { Pool } from "mariadb";
import path from 'path';
import fs from 'fs';

export type DisputeVoteRowPK = Pick<DisputeVoteRow, 'message_id' | 'channel_id' | 'user_id'>;
export type DisputeVoteRowFK = Pick<DisputeRow, 'message_id' | 'channel_id'>;
export interface DisputeVoteRow {
    readonly message_id: string;
    readonly channel_id: string;
    readonly user_id: string;
    readonly epoch: number;
    readonly vote: string;
}

export class DisputeVoteTable extends MariaDBTable<DisputeVoteRow, DisputeVoteRowPK, DisputeVoteRowFK> {

    constructor(pool: Pool) {
        super(pool, 'dispute_vote');
    }

    public selectDisputeVoteCount(message: APIMessage | Message): Promise<{ vote: string, count: number; }[]> {
        const sql = `SELECT vote, COUNT(*) AS count FROM ${this.table} WHERE message_id = :message_id AND channel_id = :channel_id GROUP BY vote`;
        return super.query(sql, {
            message_id: message.id,
            channel_id: message instanceof Message ? message.channelId : message.channel_id
        });
    }

    public selectDisputeVotes(message: APIMessage | Message): Promise<DisputeVoteRow[]> {
        return super.select({
            message_id: message.id,
            channel_id: message instanceof Message ? message.channelId : message.channel_id
        });
    }

    public async insertDisputeVote(contextMenu: MessageContextMenuCommandInteraction, user: User, vote: string): Promise<void>;
    public async insertDisputeVote(contextMenu: MessageContextMenuCommandInteraction, button: ButtonInteraction): Promise<void>;
    public async insertDisputeVote(contextMenu: MessageContextMenuCommandInteraction, scope: ButtonInteraction | User, vote?: string): Promise<void> {
        vote = vote ?? (scope instanceof ButtonInteraction ? scope.customId : vote);
        if (!vote) throw new Error('Unknown user vote');
        return super.insert({
            message_id: contextMenu.targetMessage.id,
            channel_id: contextMenu.channelId,
            user_id: scope instanceof ButtonInteraction ? scope.user.id : scope.id,
            epoch: scope instanceof ButtonInteraction ? scope.createdTimestamp : Date.now(),
            vote: vote
        });
    }

    public deleteDisputeVote(message: APIMessage | Message, user?: User): Promise<void> {
        return super.delete({
            message_id: message.id,
            channel_id: message instanceof Message ? message.channelId : message.channel_id,
            ...(user && { user_id: user.id })
        });
    }

    public async createTable(): Promise<void> {
        const sql = fs.readFileSync(`${path.resolve()}/res/schemas/dispute_vote.sql`, 'utf8');
        return this.query(sql).catch(error => {
            if (error.code !== 'ER_TABLE_EXISTS_ERROR') throw error.reason;
        });
    }
}
