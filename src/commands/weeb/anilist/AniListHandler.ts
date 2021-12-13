import { AniListReplyBuilder, AniListUserComponentID } from '../../../builders/AniListReplyBuilder.js';
import { AniListAPI, AniListResponse, QueryVars } from '../../../apis/anilist/AniListAPI.js';
import { ChatInputHandler } from '../../../discord/handlers/abstracts/ChatInputHandler.js';
import { HandlerButtonID } from '../../../discord/helpers/components/HandlerButton.js';
import { AniListCommandData, AniListSubCommand } from './AniListCommandData.js';
import { HandlerUtil } from '../../../discord/HandlerUtil.js';
import { CommandInteraction } from 'discord.js';
import { Redis } from 'ioredis';
import path from 'path';
import fs from 'fs';

export class AniListHandler extends ChatInputHandler {

    private readonly api: AniListAPI;

    constructor(redis: Redis) {
        super({ data: AniListCommandData, group: 'Weeb' });
        this.api = new AniListAPI({ redis });
    }

    public async execute(command: CommandInteraction<'cached'>): Promise<any> {
        await command.deferReply();
        const subCommand = command.options.getSubcommand(true) as AniListSubCommand;
        const search = command.options.getString('search', true);
        const vars = { ...(parseInt(search) ? { id: parseInt(search) } : { search: search }), page: 1 };
        let res = await this.fetchAniListData(subCommand, vars);
        const replyOptions = await this.fetchReplyOptions(command, search, subCommand, res);
        const message = await command.followUp(replyOptions);
        const collector = message.createMessageComponentCollector({ idle: 1000 * 60 * 5 });
        collector.on('collect', HandlerUtil.handleCollectorErrors(async component => {
            switch (component.customId) {
                case AniListUserComponentID.ANIME_LIST:
                case AniListUserComponentID.MANGA_LIST:
                case AniListUserComponentID.ACTIVITIES:
                case AniListUserComponentID.PROFILE: {
                    const replyOptions = await this.fetchReplyOptions(command, search, component.customId, res);
                    return await component.update(replyOptions);
                }
                default: {
                    await component.deferUpdate();
                    let { pageInfo } = res.data.Page || {};
                    const totalPages = pageInfo ? (pageInfo.total || 1) : 1;
                    if (component.customId === HandlerButtonID.NEXT_PAGE) vars.page++;
                    if (component.customId === HandlerButtonID.PREVIOUS_PAGE) vars.page--;
                    vars.page = vars.page % totalPages;
                    vars.page = vars.page >= 1 ? vars.page : totalPages + vars.page;
                    res = await this.fetchAniListData(subCommand, vars);
                    const replyOptions = await this.fetchReplyOptions(command, search, subCommand, res);
                    return await component.editReply(replyOptions);
                }
            }
        }));
        collector.on('end', HandlerUtil.deleteComponentsOnEnd(message));
    }

    /**
     * A helper function to query anilist
     * Note activities is unique as it is not obtainable through a user query even though we add it as a button
     */
    private async fetchAniListData(subCommand: AniListSubCommand | 'activities', vars: QueryVars): Promise<AniListResponse> {
        switch (subCommand) {
            case AniListSubCommand.USER: {
                const query = fs.readFileSync(`${path.resolve()}/res/queries/user_page.gql`, 'utf8');
                return this.api.request(query, vars);
            }
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
            case AniListSubCommand.STUDIO: {
                const query = fs.readFileSync(`${path.resolve()}/res/queries/studios_page.gql`, 'utf8');
                return this.api.request(query, vars);
            }
            case 'activities': {
                const query = fs.readFileSync(`${path.resolve()}/res/queries/activities_page.gql`, 'utf8');
                return this.api.request(query, vars);
            }
        }
    }

    /**
     * This will create an anilist reply for any of the command/button inputs
     * Note this is async as activities is not a command however needs to be fetched when the button is pressed
     */
    private async fetchReplyOptions(command: CommandInteraction, search: string, scope: AniListSubCommand | AniListUserComponentID, res: AniListResponse): Promise<AniListReplyBuilder> {
        const page = res.data.Page;
        const builder = new AniListReplyBuilder(command);
        if (!page) return builder.addUnexpectedErrorEmbed('[anilist] No page on anilist response');
        if (res.errors) return builder.addAniListErrorsEmbed(res.errors);
        const totalPages = page.pageInfo ? page.pageInfo.total || 0 : 0;
        switch (scope) {
            case AniListSubCommand.CHARACTER: {
                if (!page.characters || !page.characters[0]) return builder.addNotFoundEmbed(search);
                else {
                    const siteURL = page.characters[0].siteUrl || undefined;
                    builder.addCharacterEmbed(page.characters[0], page.pageInfo);
                    if (totalPages) builder.addPageActionRow(siteURL, undefined, totalPages <= 1);
                    return builder;
                }
            }
            case AniListSubCommand.MEDIA: {
                if (!page.media || !page.media[0]) return builder.addNotFoundEmbed(search);
                else {
                    const siteURL = page.media[0].siteUrl || undefined;
                    builder.addMediaEmbed(page.media[0], page.pageInfo);
                    if (totalPages) builder.addPageActionRow(siteURL, undefined, totalPages <= 1);
                    return builder;
                }
            }
            case AniListSubCommand.STAFF: {
                if (!page.staff || !page.staff[0]) return builder.addNotFoundEmbed(search);
                else {
                    const siteURL = page.staff[0].siteUrl || undefined;
                    builder.addStaffEmbed(page.staff[0], page.pageInfo);
                    if (totalPages) builder.addPageActionRow(siteURL, undefined, totalPages <= 1);
                    return builder;
                };
            }
            case AniListSubCommand.STUDIO: {
                if (!page.studios || !page.studios[0]) return builder.addNotFoundEmbed(search);
                else {
                    const siteURL = page.studios[0].siteUrl || undefined;
                    builder.addStudioEmbed(page.studios[0], page.pageInfo);
                    if (totalPages) builder.addPageActionRow(siteURL, undefined, totalPages <= 1);
                    return builder;
                };
            }
            case AniListUserComponentID.PROFILE:
            case AniListSubCommand.USER: {
                if (!page.users || !page.users[0]) return builder.addNotFoundEmbed(search);
                else {
                    const siteURL = page.users[0].siteUrl || undefined;
                    builder.addUserEmbed(page.users[0], page.pageInfo);
                    if (page.users[0].statistics) builder.addUserButtons(page.users[0].statistics, AniListUserComponentID.PROFILE);
                    if (totalPages) builder.addPageActionRow(siteURL, undefined, totalPages <= 1);
                    return builder;
                };
            }
            case AniListUserComponentID.ANIME_LIST: {
                if (!page.users || !page.users[0]) return builder.addNotFoundEmbed(search);
                else {
                    const siteURL = page.users[0].siteUrl || undefined;
                    builder.addUserStatsEmbed('anime', page.users[0]);
                    if (page.users[0].statistics) builder.addUserButtons(page.users[0].statistics, AniListUserComponentID.ANIME_LIST);
                    if (totalPages) builder.addPageActionRow(siteURL, undefined, totalPages <= 1);
                    return builder;
                };
            }
            case AniListUserComponentID.MANGA_LIST: {
                if (!page.users || !page.users[0]) return builder.addNotFoundEmbed(search);
                else {
                    const siteURL = page.users[0].siteUrl || undefined;
                    builder.addUserStatsEmbed('manga', page.users[0]);
                    if (page.users[0].statistics) builder.addUserButtons(page.users[0].statistics, AniListUserComponentID.MANGA_LIST);
                    if (totalPages) builder.addPageActionRow(siteURL, undefined, totalPages <= 1);
                    return builder;
                };
            }
            case AniListUserComponentID.ACTIVITIES: {
                if (!page.users || !page.users[0] || !page.users[0].id) return builder.addNotFoundEmbed(search);
                else {
                    const userID = page.users[0].id;
                    const activitiesRes = await this.fetchAniListData('activities', { userId: userID });
                    if (!activitiesRes.data.Page) return builder.addUnexpectedErrorEmbed('[anilist] No page on anilist response');
                    if (activitiesRes.errors) return builder.addAniListErrorsEmbed(activitiesRes.errors);
                    const activities = activitiesRes.data.Page.activities || [];
                    const siteURL = page.users[0].siteUrl || undefined;
                    builder.addUserActivitiesEmbed(page.users[0], activities);
                    if (page.users[0].statistics) builder.addUserButtons(page.users[0].statistics, AniListUserComponentID.ACTIVITIES);
                    if (totalPages) builder.addPageActionRow(siteURL, undefined, totalPages <= 1);
                    return builder;
                };
            }
        }
    }
}
