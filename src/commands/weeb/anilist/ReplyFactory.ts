import { HandlerEmbed } from "../../../discord/components/HandlerEmbed";
import { Interaction, Message } from "discord.js";
import { AniListResponse } from "../../../apis/anilist/AniListAPI";

export type Context = Interaction | Message;

export class ReplyFactory {

    private readonly context: Context;

    constructor(context: Context) {
        this.context = context;
    }

    private createEmbed(): HandlerEmbed {
        return new HandlerEmbed()
            .setContextAuthor(this.context);
    }

    public createAniListErrorReply(context: Interaction | Message, res: AniListResponse): InteractionReplyOptions {
        console.error('[anilist] There was an anilist error...', res);
        const attachment = this.getAvatar('1-3');
        const embed = this.createEmbedTemplate(context)
            .setTitle('AniList Error')
            .setThumbnail(attachment.getEmbedUrl())
            .setDescription(res.errors && res.errors[0] ? res.errors[0].message : 'Unknown reason...');
        return { embeds: [embed], files: [attachment] };
    }
}