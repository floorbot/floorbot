import { AniListAPI, AniListAPIRequest, AniListResponse, QueryVars } from '../../../lib/apis/anilist/AniListAPI.js';
import { ChatInputApplicationCommandData, ChatInputCommandInteraction, CommandInteraction } from 'discord.js';
import { AniListReplyBuilder, AniListComponentID, AniListUserStatTypes } from './AniListReplyBuilder.js';
import { AniListChatInputCommandData, AniListSubCommand } from './AniListChatInputCommandData.js';
import { PageableComponentID } from '../../../lib/builders/PageableButtonActionRowBuilder.js';
import { HandlerUtil } from '../../../lib/discord/HandlerUtil.js';
import { ApplicationCommandHandler } from 'discord.js-handlers';
import { Redis } from 'ioredis';
import path from 'path';
import fs from 'fs';

export class AniListChatInputHandler extends ApplicationCommandHandler<ChatInputApplicationCommandData> {

    private readonly api: AniListAPI;
    private readonly requests: {
        user: AniListAPIRequest;
        media: AniListAPIRequest;
        character: AniListAPIRequest;
        staff: AniListAPIRequest;
        studio: AniListAPIRequest;
        activities: AniListAPIRequest;
    };

    constructor(redis: Redis) {
        super(AniListChatInputCommandData);
        this.api = new AniListAPI({ redis });
        this.requests = {
            user: this.api.prepareRequest(fs.readFileSync(`${path.resolve()}/res/queries/user_page.gql`, 'utf8')),
            media: this.api.prepareRequest(fs.readFileSync(`${path.resolve()}/res/queries/media_page.gql`, 'utf8')),
            character: this.api.prepareRequest(fs.readFileSync(`${path.resolve()}/res/queries/characters_page.gql`, 'utf8')),
            staff: this.api.prepareRequest(fs.readFileSync(`${path.resolve()}/res/queries/staff_page.gql`, 'utf8')),
            studio: this.api.prepareRequest(fs.readFileSync(`${path.resolve()}/res/queries/studios_page.gql`, 'utf8')),
            activities: this.api.prepareRequest(fs.readFileSync(`${path.resolve()}/res/queries/activities_page.gql`, 'utf8'))
        };
    }

    public async run(command: ChatInputCommandInteraction<'cached'>): Promise<any> {
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
                case AniListComponentID.ANIME_LIST:
                case AniListComponentID.MANGA_LIST:
                case AniListComponentID.ACTIVITIES:
                case AniListComponentID.PROFILE: {
                    const replyOptions = await this.fetchReplyOptions(command, search, component.customId, res);
                    return await component.update(replyOptions);
                }
                default: {
                    await component.deferUpdate();
                    let { pageInfo } = res.data.Page || {};
                    const totalPages = pageInfo ? (pageInfo.total || 1) : 1;
                    if (component.customId === PageableComponentID.NEXT_PAGE) vars.page++;
                    if (component.customId === PageableComponentID.PREVIOUS_PAGE) vars.page--;
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
            case AniListSubCommand.USER: return this.requests.user(vars);
            case AniListSubCommand.MEDIA: return this.requests.media(vars);
            case AniListSubCommand.CHARACTER: return this.requests.character(vars);
            case AniListSubCommand.STAFF: return this.requests.staff(vars);
            case AniListSubCommand.STUDIO: return this.requests.studio(vars);
            case 'activities': return this.requests.activities(vars);
        }
    }

    /**
     * This will create an anilist reply for any of the command/button inputs
     * Note this is async as activities is not a command however needs to be fetched when the button is pressed
     */
    private async fetchReplyOptions(command: CommandInteraction, search: string, scope: AniListSubCommand | AniListComponentID, res: AniListResponse): Promise<AniListReplyBuilder> {
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
            case AniListComponentID.PROFILE:
            case AniListSubCommand.USER: {
                if (!page.users || !page.users[0]) return builder.addNotFoundEmbed(search);
                else {
                    const siteURL = page.users[0].siteUrl || undefined;
                    builder.addUserEmbed(page.users[0], page.pageInfo);
                    if (page.users[0].statistics) builder.addProfileActionRow(page.users[0].statistics, AniListComponentID.PROFILE);
                    if (totalPages) builder.addPageActionRow(siteURL, undefined, totalPages <= 1);
                    return builder;
                };
            }
            case AniListComponentID.ANIME_LIST: {
                if (!page.users || !page.users[0]) return builder.addNotFoundEmbed(search);
                else {
                    const siteURL = page.users[0].siteUrl || undefined;
                    builder.addUserStatsEmbed(AniListUserStatTypes.ANIME, page.users[0]);
                    if (page.users[0].statistics) builder.addProfileActionRow(page.users[0].statistics, AniListComponentID.ANIME_LIST);
                    if (totalPages) builder.addPageActionRow(siteURL, undefined, totalPages <= 1);
                    return builder;
                };
            }
            case AniListComponentID.MANGA_LIST: {
                if (!page.users || !page.users[0]) return builder.addNotFoundEmbed(search);
                else {
                    const siteURL = page.users[0].siteUrl || undefined;
                    builder.addUserStatsEmbed(AniListUserStatTypes.MANGA, page.users[0]);
                    if (page.users[0].statistics) builder.addProfileActionRow(page.users[0].statistics, AniListComponentID.MANGA_LIST);
                    if (totalPages) builder.addPageActionRow(siteURL, undefined, totalPages <= 1);
                    return builder;
                };
            }
            case AniListComponentID.ACTIVITIES: {
                if (!page.users || !page.users[0] || !page.users[0].id) return builder.addNotFoundEmbed(search);
                else {
                    const userID = page.users[0].id;
                    const activitiesRes = await this.fetchAniListData('activities', { userId: userID });
                    if (!activitiesRes.data.Page) return builder.addUnexpectedErrorEmbed('[anilist] No page on anilist response');
                    if (activitiesRes.errors) return builder.addAniListErrorsEmbed(activitiesRes.errors);
                    const activities = activitiesRes.data.Page.activities || [];
                    const siteURL = page.users[0].siteUrl || undefined;
                    builder.addUserActivitiesEmbed(page.users[0], activities);
                    if (page.users[0].statistics) builder.addProfileActionRow(page.users[0].statistics, AniListComponentID.ACTIVITIES);
                    if (totalPages) builder.addPageActionRow(siteURL, undefined, totalPages <= 1);
                    return builder;
                };
            }
        }
    }
}
