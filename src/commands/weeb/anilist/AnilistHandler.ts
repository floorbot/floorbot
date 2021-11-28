import { ChatInputHandler } from '../../../discord/handler/abstracts/ChatInputHandler.js';
import { AniListAPI, AniListAPIRequest } from '../../../apis/anilist/AniListAPI.js';
import { AniListCommandData } from './AniListCommandData.js';
import { AniListReplies } from './replies/AnilistReplies.js';
import { CommandInteraction } from 'discord.js';
import { Redis } from 'ioredis';
import path from 'path';
import fs from 'fs';

export class AnilistHandler extends ChatInputHandler {

    private readonly fetchMediaPage: AniListAPIRequest;
    private readonly replies: AniListReplies;
    private readonly api: AniListAPI;

    constructor(redis: Redis) {
        super({ data: AniListCommandData, group: 'Weeb' });
        this.replies = new AniListReplies();
        this.api = new AniListAPI({ redis: redis });
        this.fetchMediaPage = this.api.prepareRequest(fs.readFileSync(`${path.resolve()}/res/queries/media_page.gql`, 'utf8'));
    }

    public async execute(command: CommandInteraction<'cached'>): Promise<any> {

        const subCommand = command.options.getSubcommand(true);

        switch (subCommand) {
            case 'media': {
                await command.deferReply();
                const search = command.options.getString('search', true);
                const vars = { ...(parseInt(search) ? { id: parseInt(search) } : { search: search }), page: 1 };
                const res = await this.fetchMediaPage(vars);
                if (res.errors || !res.data.Page) return command.followUp(this.replies.createAniListErrorReply(command, res));
                return command.followUp(this.replies.createMediaReply(command, res.data.Page));
            }
        }
        return null;
    }
}
