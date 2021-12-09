import { HandlerDatabase, HandlerDB } from '../../../discord/helpers/HandlerDatabase.js';
import { Message, Interaction, User } from 'discord.js';
import path from 'path';
import fs from 'fs';

export interface DisputeRow {
    readonly epoch: string,
    readonly dispute_user_id: string,
    readonly message_user_id: string,
    readonly guild_id: string,
    readonly channel_id: string,
    readonly message_id: string,
    readonly content: string,
    readonly vote_user_id: string,
    readonly vote_choice: boolean
}

export interface DisputeResults {
    readonly yes_votes: Number,
    readonly no_votes: Number,
    readonly total_votes: Number,
    readonly successful_pct: Number,
    readonly successful_pct_rounded: Number,
    readonly dispute_user_id: string,
    readonly message_user_id: string
}

export class DisputeDatabase extends HandlerDatabase {

    constructor(db: HandlerDB) {
        super({ db: db });
    }

    public async fetchResults(message: Message): Promise<DisputeResults | null> {
        const sql = `SELECT sum(vote_choice) yes_votes,
                            count(*) - sum(vote_choice) no_votes,
                            count(*) total_votes,
                            sum(cast(vote_choice as double)) / count(*) * 100 successful_pct,
                            round(sum(cast(vote_choice as double)) / count(*) * 100,2) successful_pct_rounded,
                            dispute_user_id dispute_user_id,
                            message_user_id message_user_id
                       FROM dispute
                      WHERE guild_id = :guild_id
                        AND channel_id = :channel_id
                        AND message_id = :message_id`;
        const query = {
            guild_id: message.guild!.id,
            channel_id: message.channel.id,
            message_id: message.id
        };
        const rows = await this.select(sql, query);
        return rows.length ? rows[0] : null;
    }

    public async getVoters(message: Message, which: string): Promise<string | null> {
        let sql = ''
        if (which == 'yes') {
            sql = 'SELECT * FROM dispute WHERE guild_id = :guild_id and channel_id = :channel_id and message_id = :message_id and vote_choice = 1'
        } else {
            sql = 'SELECT * FROM dispute WHERE guild_id = :guild_id and channel_id = :channel_id and message_id = :message_id and vote_choice = 0'
        };
        const query = {
            guild_id: message.guild!.id,
            channel_id: message.channel.id,
            message_id: message.id
        };
        const rows = await this.select(sql, query);
        let result = []
        for (let i = 0; i < rows.length; i++) {
            result.push(`<@${rows[i]['vote_user_id']}>`)
        }
        return result.join('\n');
    }

    public async getDisputeVote(interaction: Interaction, message: Message): Promise<DisputeRow | null> {
        const sql = 'SELECT * FROM dispute WHERE guild_id = :guild_id AND channel_id = :channel_id AND message_id = :message_id and vote_user_id = :vote_user_id LIMIT 1';
        const query = {
            guild_id: message.guild!.id,
            channel_id: message.channel.id,
            message_id: message.id,
            vote_user_id: interaction.user!.id
        };
        const rows = await this.select(sql, query);
        return rows.length ? rows[0] : null;
    }

    public async setDisputeVote(contextMenu: Interaction, buttonClick: Interaction, message: Message, choice: boolean) {
        const sql = 'REPLACE INTO dispute VALUES (:epoch, :dispute_user_id, :message_user_id, :guild_id, :channel_id, :message_id, :content, :vote_user_id, :vote_choice)';
        return await this.exec(sql, {
            epoch: message.createdTimestamp,
            dispute_user_id: contextMenu.user.id,
            message_user_id: message.author.id,
            guild_id: message.guild!.id,
            channel_id: message.channel.id,
            message_id: message.id,
            content: message.content,
            vote_user_id: buttonClick.user!.id,
            vote_choice: choice
        });
    }

    public async setDisputeVoteID(contextMenu: Interaction, user: User, message: Message, choice: boolean) {
        const sql = 'REPLACE INTO dispute VALUES (:epoch, :dispute_user_id, :message_user_id, :guild_id, :channel_id, :message_id, :content, :vote_user_id, :vote_choice)';
        return await this.exec(sql, {
            epoch: message.createdTimestamp,
            dispute_user_id: contextMenu.user.id,
            message_user_id: message.author.id,
            guild_id: message.guild!.id,
            channel_id: message.channel.id,
            message_id: message.id,
            content: message.content,
            vote_user_id: user.id,
            vote_choice: choice
        });
    }

    public async deleteResults(message: Message) {
        const sql = 'delete from dispute where guild_id = :guild_id AND channel_id = :channel_id AND message_id = :message_id';
        return await this.exec(sql, {
            guild_id: message.guild!.id,
            channel_id: message.channel.id,
            message_id: message.id
        });
    }

    public async disputeExists(message: Message): Promise<boolean | null> {
        const sql = 'SELECT * FROM dispute WHERE guild_id = :guild_id AND channel_id = :channel_id AND message_id = :message_id LIMIT 1';
        const query = {
            guild_id: message.guild!.id,
            channel_id: message.channel.id,
            message_id: message.id
        };
        const rows = await this.select(sql, query);
        return rows.length;
    }

    public async createTables(): Promise<void> {
        return Promise.allSettled([
            this.exec(fs.readFileSync(`${path.resolve()}/res/schemas/dispute.sql`, 'utf8'))
        ]).then(ress => {
            return ress.forEach(res => {
                if (res.status === 'fulfilled') return;
                if (res.reason.code !== 'ER_TABLE_EXISTS_ERROR') throw res.reason;
            })
        })
    }
}
