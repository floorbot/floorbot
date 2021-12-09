import { AniListAPI, AniListResponse, QueryVars } from '../../../apis/anilist/AniListAPI.js';
import { ChatInputHandler } from '../../../discord/handlers/abstracts/ChatInputHandler.js';
import { HandlerButtonID } from '../../../discord/helpers/components/HandlerButton.js';
import { AniListCommandData, AniListSubCommand } from './AniListCommandData.js';
import { HandlerUtil } from '../../../discord/HandlerUtil.js';
import { AniListReplies } from './AnilistReplies.js';
import { CommandInteraction } from 'discord.js';
import { Redis } from 'ioredis';
import path from 'path';
import fs from 'fs';

export class AnilistHandler extends ChatInputHandler {

    private readonly replies: AniListReplies;
    private readonly api: AniListAPI;

    constructor(redis: Redis) {
        super({ data: AniListCommandData, group: 'Weeb' });
        this.replies = new AniListReplies();
        this.api = new AniListAPI({ redis: redis });
    }

    public async execute(command: CommandInteraction<'cached'>): Promise<any> {
        await command.deferReply();
        const subCommand = command.options.getSubcommand(true) as AniListSubCommand;
        const search = command.options.getString('search', true);
        const vars = { ...(parseInt(search) ? { id: parseInt(search) } : { search: search }), page: 1 };
        let res = await this.fetchAniListData(subCommand, vars);
        const replyOptions = this.replies.createAniListReply(command, subCommand, res);
        const message = await command.followUp(replyOptions);
        const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 5 });
        collector.on('collect', HandlerUtil.handleCollectorErrors(async component => {
            await component.deferUpdate();
            let { pageInfo } = res.data.Page || {};
            const totalPages = pageInfo ? (pageInfo.total || 1) : 1;
            if (component.customId === HandlerButtonID.NEXT_PAGE) vars.page++;
            if (component.customId === HandlerButtonID.PREVIOUS_PAGE) vars.page--;
            vars.page = vars.page % totalPages;
            vars.page = vars.page >= 1 ? vars.page : totalPages + vars.page;
            res = await this.fetchAniListData(subCommand, vars);
            const replyOptions = this.replies.createAniListReply(command, subCommand, res);
            return await component.editReply(replyOptions);
        }));
        collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
    }

    private async fetchAniListData(subCommand: AniListSubCommand, vars: QueryVars): Promise<AniListResponse> {
        switch (subCommand) {
            case AniListSubCommand.MEDIA: {
                const query = fs.readFileSync(`${path.resolve()}/res/queries/media_page.gql`, 'utf8');
                return this.api.request(query, vars);
            }
            case AniListSubCommand.CHARACTER: {
                const query = fs.readFileSync(`${path.resolve()}/res/queries/characters_page.gql`, 'utf8');
                return this.api.request(query, vars);
            }
            case AniListSubCommand.STAFF: {
                const query = fs.readFileSync(`${path.resolve()}/res/queries/staff_page.gql`, 'utf8');
                return this.api.request(query, vars);
            }
        }
    }
}
