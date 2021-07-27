import { CommandInteraction, InteractionReplyOptions, MessageActionRow, ButtonInteraction, Message } from 'discord.js';
import { MediaButtonFactory } from '../factories/buttons/MediaButtonFactory';
import { MediaEmbedFactory } from '../factories/embeds/MediaEmbedFactory';
import { AniListCustomData, AniListHandler } from '../AniListHandler';
import { MediaRequest } from '../requests/MediaRequest';
import { GuildHandlerGroup } from '../../GuildHandler';
import { AnimeCommandData } from './AnimeCommandData';
import { HandlerContext } from 'discord.js-commands';
import { MediaType } from '../api/AniListAPI';

export interface AnimeCustomData extends AniListCustomData {
    readonly sub: 'page' | 'desc',
    readonly search?: string
    readonly perPage?: number
    readonly page?: number
    readonly id?: number
    readonly desc?: boolean
}

export class AnimeHandler extends AniListHandler<AnimeCustomData> {

    constructor() {
        super({ id: 'anime', commandData: AnimeCommandData, group: GuildHandlerGroup.ANIME });
    }

    public override async onCommand(interaction: CommandInteraction): Promise<any> {
        await interaction.defer();
        const query = interaction.options.getString('query')!;
        const response = await this.fetchPageResponse(interaction, { sub: 'page', search: query, page: 0, perPage: 10 });
        return interaction.followUp(response);
    }

    public override async onButton(interaction: ButtonInteraction, customData: AnimeCustomData): Promise<any> {
        await interaction.deferUpdate();
        const { message } = <{ message: Message }>interaction;
        switch (customData.sub) {
            case 'page': {
                const response = await this.fetchPageResponse(interaction, customData);
                return message.edit(response);
            }
            default: throw { interaction, customData }
        }
    }

    public async fetchPageResponse(context: HandlerContext, customData: AnimeCustomData): Promise<InteractionReplyOptions> {
        const page = await MediaRequest.fetchPage(customData.search!, MediaType.ANIME, Math.ceil(customData.page! / customData.perPage!), customData.perPage!);
        if (!page || !page.media || !page.media.length) return this.getNotFoundResponse(context, customData.search!);
        const mediaId = page.media[customData.page! % customData.perPage!]!.id;
        const media = await MediaRequest.fetchMedia(mediaId, MediaType.ANIME);
        if (!media) return this.getNotFoundResponse(context, mediaId.toString());
        const embed = MediaEmbedFactory.getMediaPageEmbed(this, context, media, page, customData);
        const pageActionRow = new MessageActionRow().addComponents([
            MediaButtonFactory.getMediaPagePreviousButton(this, page, customData),
            MediaButtonFactory.getMediaPageNextButton(this, page, customData),
            MediaButtonFactory.getDescriptionButton(this, customData),
            MediaButtonFactory.getViewOnlineButton(this, media.siteUrl!),
        ])
        return { embeds: [embed], components: [pageActionRow] };
    }
}
