import { CommandInteraction, InteractionReplyOptions, Util, Message, MessageActionRow, ButtonInteraction } from 'discord.js';
import { HandlerContext, HandlerCustomData, HandlerEmbed } from 'discord.js-commands';
import { FuzzyDate, Page, PageInfo } from './api/interfaces/Common';
import { AniListButtonFactory } from './factories/AniListButtonFactory';
import { GuildHandler, GuildHandlerOptions } from '../..';

export interface AniListCustomData extends HandlerCustomData {
    edge?: 'media' | 'characters' | 'staff',
    display?: 'desc' | 'banner',
    query: string | number,
    edgePage: number,
    page: number,
    plus?: boolean
}

export abstract class AniListHandler extends GuildHandler<AniListCustomData> {

    public static readonly PER_PAGE = 25;

    constructor(options: GuildHandlerOptions) {
        super(options);
    }

    public abstract fetchPage(query: string | number, page: number): Promise<Page | null>;
    public abstract getEmbed(context: HandlerContext, customData: AniListCustomData, page: Page): HandlerEmbed;
    public abstract getCharacterEdgeEmbed(context: HandlerContext, customData: AniListCustomData, page: Page): HandlerEmbed;

    public override async onCommand(interaction: CommandInteraction): Promise<any> {
        await interaction.deferReply();
        const query = interaction.options.getString('query')!;
        const response = await this.fetchPageResponse(interaction, { query: query, page: 0, edgePage: 0 });
        return interaction.followUp(response);
    }

    public override async onButton(interaction: ButtonInteraction, customData: AniListCustomData): Promise<any> {
        await interaction.deferUpdate();
        const { message } = <{ message: Message }>interaction;
        switch (customData.edge) {
            case undefined: {
                const response = await this.fetchPageResponse(interaction, customData);
                return message.edit(response);
            }
            case 'characters': {
                const response = await this.fetchPageResponse(interaction, customData);
                return message.edit(response);
            }
            default: throw { interaction, customData }
        }
    }

    public async fetchPageResponse(context: HandlerContext, customData: AniListCustomData): Promise<InteractionReplyOptions> {
        const page = await this.fetchPage(customData.query, customData.page);
        if (!page || !page.media || !page.media.length) return this.getNotFoundResponse(context, customData.query);

        switch (customData.edge) {
            case undefined: {
                const embed = this.getEmbed(context, customData, page);
                const pageActionRow = new MessageActionRow().addComponents([
                    AniListButtonFactory.getPreviousPageButton(this, customData, page),
                    AniListButtonFactory.getNextPageButton(this, customData, page),
                    ...(page.media[0]!.description ? [AniListButtonFactory.getDescriptionButton(this, customData)] : []),
                    AniListButtonFactory.getViewOnlineButton(this, page.media[0]!.siteUrl!),
                    AniListButtonFactory.getPlusButton(this, customData)
                ])
                const edgeActionRow = new MessageActionRow().addComponents([
                    ...(page.media[0]!.characters ?.edges ?.length ? [AniListButtonFactory.getConnectionButton(this, customData, 'characters')] : [])
                ])
                return { embeds: [embed], components: [pageActionRow, edgeActionRow] };
            }
            case 'characters': {
                const embed = this.getCharacterEdgeEmbed(context, customData, page);
                const pageActionRow = new MessageActionRow().addComponents([
                    AniListButtonFactory.getPreviousPageButton(this, customData, page),
                    AniListButtonFactory.getNextPageButton(this, customData, page),
                    ...(page.media[0]!.description ? [AniListButtonFactory.getDescriptionButton(this, customData)] : []),
                    AniListButtonFactory.getViewOnlineButton(this, page.media[0]!.siteUrl!),
                    AniListButtonFactory.getPlusButton(this, customData)
                ])
                const edgeActionRow = new MessageActionRow().addComponents([
                    ...(page.media[0]!.characters ?.edges ?.length ? [AniListButtonFactory.getConnectionButton(this, customData, 'characters')] : [])
                ])
                return { embeds: [embed], components: [pageActionRow, edgeActionRow] };
            }
            default: throw { context, customData }
        }


    }

    public override getEmbedTemplate(context: HandlerContext, customData: AniListCustomData, pageInfo?: PageInfo): HandlerEmbed {
        const pageText = pageInfo ? `${pageInfo.currentPage}/${pageInfo.total}` : '';
        const embed = super.getEmbedTemplate(context)
            .setFooter(`${pageText} Powered by AniList`, 'https://anilist.co/img/icons/android-chrome-512x512.png');
        if (!customData.edge && typeof customData.query === 'string') embed.setAuthor(`Search: ${customData.query}`);
        return embed;
    }

    public getFuzzyDateString(fuzzy: FuzzyDate): string | null {
        const date = new Date();
        if (fuzzy.day && fuzzy.month && fuzzy.year) {
            date.setDate(fuzzy.day);
            date.setMonth(fuzzy.month - 1);
            date.setFullYear(fuzzy.year);
            return `<t:${Math.round(date.getTime() / 1000)}:D>`;
        } else if (!fuzzy.day && !fuzzy.month && !fuzzy.month) {
            return null;
        } else {
            var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            return [fuzzy.month ? months[fuzzy.month - 1] : null, fuzzy.day, fuzzy.year].filter(part => part || part === 0).join(' ')
        }
    }

    public reduceDescription(description: string) {
        return Util.splitMessage(description.replace(/<\/?[^>]+(>|$)/g, ''), { char: ' ', append: '...', maxLength: 1024 })[0]!
    }
}
