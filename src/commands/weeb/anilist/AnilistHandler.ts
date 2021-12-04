import { AniListAPI, AniListAPIRequest, Media, Page, PageInfo } from '../../../apis/anilist/AniListAPI.js';
import { ChatInputHandler } from '../../../discord/handler/abstracts/ChatInputHandler.js';
import { HandlerButtonID } from '../../../discord/components/HandlerButton.js';
import { HandlerUtil } from '../../../discord/handler/HandlerUtil.js';
import { AniListCommandData } from './AniListCommandData.js';
import { AniListReplies } from './replies/AnilistReplies.js';
import { CommandInteraction } from 'discord.js';
import { Redis } from 'ioredis';
import path from 'path';
import fs from 'fs';

export class AnilistHandler extends ChatInputHandler {

    private readonly fetchCharactersPage: AniListAPIRequest;
    private readonly fetchMediaPage: AniListAPIRequest;
    private readonly replies: AniListReplies;
    private readonly api: AniListAPI;

    constructor(redis: Redis) {
        super({ data: AniListCommandData, group: 'Weeb' });
        this.replies = new AniListReplies();
        this.api = new AniListAPI({ redis: redis });
        this.fetchCharactersPage = this.api.prepareRequest(fs.readFileSync(`${path.resolve()}/res/queries/characters_page.gql`, 'utf8'));
        this.fetchMediaPage = this.api.prepareRequest(fs.readFileSync(`${path.resolve()}/res/queries/media_page.gql`, 'utf8'));
    }

    public async execute(command: CommandInteraction<'cached'>): Promise<any> {

        const subCommand = command.options.getSubcommand(true);
        let page = 1;

        switch (subCommand) {
            case 'media': {
                await command.deferReply();
                const search = command.options.getString('search', true);
                const vars = { ...(parseInt(search) ? { id: parseInt(search) } : { search: search }), page: page };
                const res = await this.fetchMediaPage(vars);
                if (res.errors || !res.data.Page) return command.followUp(this.replies.createAniListErrorReply(command, res));
                const message = await command.followUp(this.replies.createMediaReply(command, res.data.Page));
                const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 5 });
                collector.on('collect', HandlerUtil.handleCollectorErrors(async component => {

                    const pageInfo = res.data.Page?.pageInfo

                    await component.deferUpdate();
                    // let page = res.data.Page ?.pageInfo ?.currentPage || 1;
                    if (component.customId === HandlerButtonID.NEXT_PAGE) page++;
                    if (component.customId === HandlerButtonID.PREVIOUS_PAGE) page--;
                    page = page % res.pageInfo.length;
                    page = page >= 0 ? page : definitions.length + page;
                    const replyOptions = this.replies.createMediaReply(command, res.data.Page);
                    await component.editReply(replyOptions);
                }));
                collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
                return collector;
            }
            case 'character': {
                await command.deferReply();
                const search = command.options.getString('search', true);
                const vars = { ...(parseInt(search) ? { id: parseInt(search) } : { search: search }), page: 1 };
                const res = await this.fetchCharactersPage(vars);
                if (res.errors || !res.data.Page) return command.followUp(this.replies.createAniListErrorReply(command, res));
                return command.followUp(this.replies.createCharacterReply(command, res.data.Page));
            }
        }
        return null;
    }
}
